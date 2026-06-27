"""Tasks 2.4-2.5: SocialSentinel agent — social sentiment analysis."""

from __future__ import annotations

from openai import OpenAI
from loguru import logger

from config import settings
from SocialSentinel.tools.twitter_client import TwitterClient, CryptoPanicClient
from SocialSentinel.tools.reddit_client import RedditClient

logger.add("logs/social.log", rotation="10 MB", retention="7 days", level="INFO")


class SocialSentinelAgent:
    def __init__(self):
        self._llm = OpenAI(
            api_key=settings.SIGNAL_ENGINE_API_KEY,
            base_url=settings.SIGNAL_ENGINE_BASE_URL,
        )
        self._twitter = (
            TwitterClient(settings.TWITTER_BEARER_TOKEN)
            if settings.TWITTER_BEARER_TOKEN else None
        )
        self._reddit = (
            RedditClient(settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET)
            if settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET else None
        )
        self._cryptopanic = CryptoPanicClient()

    def research(self, query: str, assets: list[str]) -> str:
        keywords = assets + query.split()[:3]

        posts = []
        sources_used: list[str] = []
        if self._twitter:
            twitter_posts = self._twitter.search(keywords, max_results=15)
            posts += twitter_posts
            if twitter_posts:
                sources_used.append("twitter")
        if self._reddit:
            reddit_posts = self._reddit.search(keywords, limit=15)
            posts += reddit_posts
            if reddit_posts:
                sources_used.append("reddit")
        cryptopanic_posts = self._cryptopanic.fetch(keywords, limit=15)
        posts += cryptopanic_posts
        if cryptopanic_posts:
            sources_used.append("cryptopanic")

        if not posts:
            sources_str = ", ".join(sources_used) if sources_used else "none available"
            result = (
                f"[SOCIAL] No posts found for {assets}. "
                f"Sources checked: {sources_str}. "
                f"Sentiment: NEUTRAL (confidence: 0.4)"
            )
            logger.info(result)
            return result

        snippets = "\n".join(
            f"[{p.source}] {p.content[:200]}" for p in posts[:30]
        )

        try:
            response = self._llm.chat.completions.create(
                model=settings.SIGNAL_ENGINE_MODEL_NAME,
                messages=[
                    {"role": "system", "content": (
                        "You are a crypto sentiment analyst. Analyze the posts and return:\n"
                        "SENTIMENT: BULLISH|BEARISH|NEUTRAL\n"
                        "CONFIDENCE: 0.0-1.0\n"
                        "SUMMARY: one sentence\n"
                        "Be concise and factual."
                    )},
                    {"role": "user", "content": f"Assets: {assets}\n\nPosts:\n{snippets}"},
                ],
                max_tokens=200,
            )
            analysis = response.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"SocialSentinel: LLM analysis failed ({e}), returning neutral")
            analysis = f"SENTIMENT: NEUTRAL\nCONFIDENCE: 0.4\nSUMMARY: LLM analysis unavailable"

        sources_str = ", ".join(sources_used) if sources_used else "cryptopanic"
        result = f"[SOCIAL] {query} | assets={assets} | sources={sources_str}\n{analysis}\n(posts_analyzed={len(posts)})"
        logger.info(result)
        return result
