"""
Gemini AI Chat Utility
Handles communication with Google's Gemini API for chat responses.
"""
import os
import logging
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_API_MODEL', 'gemini-1.5-flash')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def get_ai_response(article_context: dict, user_message: str, chat_history: list, language: str = 'en') -> dict:
    """
    Get a response from Gemini AI for the chat.
    
    Args:
        article_context: Dict with 'title' and 'summary' of the article
        user_message: The user's message
        chat_history: List of previous messages [{'role': 'user'/'assistant', 'content': '...'}]
        language: 'en' or 'fr'
    
    Returns:
        Dict with 'response' text and 'success' boolean
    """
    from api.models import AISettings
    
    try:
        # Get admin-configurable settings
        ai_settings = AISettings.get_settings()
        
        if not ai_settings.is_active:
            return {
                'success': False,
                'response': 'AI chat is currently disabled.'
            }
        
        if not GEMINI_API_KEY:
            logger.error("Gemini API key not configured")
            return {
                'success': False,
                'response': 'AI service not configured.'
            }
        
        # Build the system prompt with context
        language_instruction = "Respond in French." if language == 'fr' else "Respond in English."
        
        # Always include article context so AI knows what article we're discussing
        # The system prompt tells AI to use it naturally, not repeat it verbatim
        article_context_text = f"""

ARTICLE BEING DISCUSSED:
Title: {article_context.get('title', 'Unknown')}
Summary: {article_context.get('summary', 'No summary available')}"""
        
        system_prompt = f"""{ai_settings.system_prompt}

{language_instruction}{article_context_text}

Remember: Your name is {ai_settings.ai_name}. Keep responses under {ai_settings.max_response_length} characters."""

        # Initialize the model
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=system_prompt
        )
        
        # Build conversation history for context
        history_content = []
        for msg in chat_history[-5:]:  # Last 5 messages only
            if msg.get('role') == 'user':
                history_content.append({'role': 'user', 'parts': [msg.get('content', '')]})
            else:
                history_content.append({'role': 'model', 'parts': [msg.get('content', '')]})
        
        # Start chat with history
        chat = model.start_chat(history=history_content)
        
        # Get response
        response = chat.send_message(user_message)
        response_text = response.text.strip()
        
        # Truncate if too long
        if len(response_text) > ai_settings.max_response_length:
            response_text = response_text[:ai_settings.max_response_length - 3] + "..."
        
        logger.info(f"Gemini response generated ({len(response_text)} chars)")
        
        return {
            'success': True,
            'response': response_text
        }
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}", exc_info=True)
        
        # Fallback response
        fallback = "I'm having trouble connecting right now. Please try again." if language == 'en' else "J'ai des difficultés à me connecter. Veuillez réessayer."
        
        return {
            'success': False,
            'response': fallback
        }
