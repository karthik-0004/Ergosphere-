from django.core.management.base import BaseCommand

from books.ai_insights import process_all_unprocessed_books
from books.rag_pipeline import ingest_all_books
from books.scraper import run_scraper


class Command(BaseCommand):
    help = "Scrape books, generate AI insights, and ingest to ChromaDB"

    def add_arguments(self, parser):
        parser.add_argument(
            "--pages",
            type=int,
            default=3,
            help="Number of pages to scrape (default: 3)",
        )
        parser.add_argument(
            "--skip-scrape",
            action="store_true",
            help="Skip scraping and only process existing books",
        )
        parser.add_argument(
            "--skip-insights",
            action="store_true",
            help="Skip AI insight generation",
        )
        parser.add_argument(
            "--skip-ingest",
            action="store_true",
            help="Skip ChromaDB ingestion",
        )

    def handle(self, *args, **options):
        if not options["skip_scrape"]:
            self.stdout.write("Starting book scraping...")
            count = run_scraper(max_pages=options["pages"])
            self.stdout.write(self.style.SUCCESS(f"Scraped {count} books"))

        if not options["skip_insights"]:
            self.stdout.write("Generating AI insights...")
            process_all_unprocessed_books()
            self.stdout.write(self.style.SUCCESS("AI insights generation complete"))

        if not options["skip_ingest"]:
            self.stdout.write("Ingesting books to ChromaDB...")
            count = ingest_all_books()
            self.stdout.write(self.style.SUCCESS(f"Ingested {count} books to ChromaDB"))

        self.stdout.write(self.style.SUCCESS("All operations complete!"))
