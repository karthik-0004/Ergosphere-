import os
import sys
from urllib.parse import urljoin

import django
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

RATING_MAP = {
	"One": 1,
	"Two": 2,
	"Three": 3,
	"Four": 4,
	"Five": 5,
}


class BookScraper:
	def __init__(self):
		chrome_options = Options()
		chrome_options.add_argument("--headless")
		chrome_options.add_argument("--no-sandbox")
		chrome_options.add_argument("--disable-dev-shm-usage")
		chrome_options.add_argument("--disable-gpu")
		chrome_options.add_argument("--window-size=1920,1080")

		service = Service(ChromeDriverManager().install())
		self.driver = webdriver.Chrome(service=service, options=chrome_options)

	def scrape_book_listing_page(self, url):
		self.driver.get(url)
		articles = self.driver.find_elements(By.CSS_SELECTOR, "article.product_pod")
		books = []

		for article in articles:
			h3_link = article.find_element(By.CSS_SELECTOR, "h3 a")
			title = h3_link.get_attribute("title")

			rating_classes = article.find_element(
				By.CSS_SELECTOR, "p.star-rating"
			).get_attribute("class")
			rating_word = rating_classes.split()[-1]
			rating = RATING_MAP.get(rating_word)

			price = article.find_element(By.CSS_SELECTOR, "p.price_color").text.strip()
			availability = article.find_element(
				By.CSS_SELECTOR, "p.availability"
			).text.strip()

			image_src = article.find_element(By.CSS_SELECTOR, "img").get_attribute("src")
			cover_image_url = image_src.replace(
				"../", "https://books.toscrape.com/", 1
			)

			href = h3_link.get_attribute("href")
			book_url = urljoin(url, href)

			books.append(
				{
					"title": title,
					"rating": rating,
					"price": price,
					"availability": availability,
					"cover_image_url": cover_image_url,
					"book_url": book_url,
				}
			)

		return books

	def scrape_book_detail_page(self, book_url):
		self.driver.get(book_url)

		description = ""
		description_headers = self.driver.find_elements(By.ID, "product_description")
		if description_headers:
			description_candidates = self.driver.find_elements(
				By.CSS_SELECTOR, "#product_description ~ p"
			)
			if description_candidates:
				description = description_candidates[0].text.strip()

		genre = ""
		breadcrumbs = self.driver.find_elements(By.CSS_SELECTOR, "ul.breadcrumb li")
		if len(breadcrumbs) >= 3:
			genre = breadcrumbs[2].text.strip()

		num_reviews = None
		rows = self.driver.find_elements(By.CSS_SELECTOR, "table.table.table-striped tr")
		for row in rows:
			heading = row.find_element(By.TAG_NAME, "th").text.strip()
			if heading == "Number of reviews":
				value = row.find_element(By.TAG_NAME, "td").text.strip()
				try:
					num_reviews = int(value)
				except ValueError:
					num_reviews = None
				break

		return {
			"description": description,
			"genre": genre,
			"num_reviews": num_reviews,
		}

	def scrape_all_books(self, max_pages=5):
		from .models import Book

		saved_count = 0

		for page in range(1, max_pages + 1):
			listing_url = (
				f"https://books.toscrape.com/catalogue/page-{page}.html"
			)
			listing_books = self.scrape_book_listing_page(listing_url)

			for listing_book in listing_books:
				try:
					title = listing_book.get("title", "")
					if not title or Book.objects.filter(title=title).exists():
						continue

					details = self.scrape_book_detail_page(listing_book["book_url"])
					payload = {**listing_book, **details}
					payload["author"] = "Unknown"

					Book.objects.create(**payload)
					saved_count += 1
					print(f"Scraped and saved: {title}")
				except Exception as exc:
					print(
						f"Failed to scrape/save book {listing_book.get('title', '')}: {exc}"
					)

		return saved_count

	def close(self):
		self.driver.quit()


def run_scraper(max_pages=5):
	os.environ.setdefault("DJANGO_SETTINGS_MODULE", "bookplatform.settings")
	project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
	if project_root not in sys.path:
		sys.path.insert(0, project_root)
	django.setup()

	scraper = BookScraper()
	try:
		total_saved = scraper.scrape_all_books(max_pages=max_pages)
		print(f"Scraping complete. Total books saved: {total_saved}")
		return total_saved
	finally:
		scraper.close()
