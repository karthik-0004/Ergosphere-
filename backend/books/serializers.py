from rest_framework import serializers

from .models import AIInsight, Book, ChatHistory


class AIInsightSerializer(serializers.ModelSerializer):
	class Meta:
		model = AIInsight
		fields = "__all__"


class BookListSerializer(serializers.ModelSerializer):
	insights = AIInsightSerializer(read_only=True)

	class Meta:
		model = Book
		fields = [
			"id",
			"title",
			"author",
			"rating",
			"num_reviews",
			"genre",
			"book_url",
			"cover_image_url",
			"price",
			"availability",
			"created_at",
			"insights",
		]


class BookDetailSerializer(serializers.ModelSerializer):
	insights = AIInsightSerializer(read_only=True)

	class Meta:
		model = Book
		fields = [
			"id",
			"title",
			"author",
			"rating",
			"num_reviews",
			"description",
			"genre",
			"book_url",
			"cover_image_url",
			"price",
			"availability",
			"created_at",
			"updated_at",
			"insights",
		]


class ChatHistorySerializer(serializers.ModelSerializer):
	class Meta:
		model = ChatHistory
		fields = "__all__"


class BookUploadSerializer(serializers.ModelSerializer):
	class Meta:
		model = Book
		fields = [
			"title",
			"author",
			"rating",
			"num_reviews",
			"description",
			"genre",
			"book_url",
			"cover_image_url",
			"price",
			"availability",
		]
		extra_kwargs = {
			"author": {"required": False, "allow_blank": True},
			"rating": {"required": False},
			"num_reviews": {"required": False},
			"description": {"required": False},
			"genre": {"required": False},
			"book_url": {"required": False},
			"cover_image_url": {"required": False},
			"price": {"required": False},
			"availability": {"required": False},
		}

	def create(self, validated_data):
		if not validated_data.get("author"):
			validated_data["author"] = "Unknown"
		return super().create(validated_data)


class RAGQuerySerializer(serializers.Serializer):
	question = serializers.CharField(max_length=1000)
	book_id = serializers.IntegerField(required=False)
