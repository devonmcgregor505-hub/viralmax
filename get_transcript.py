import sys
from youtube_transcript_api import YouTubeTranscriptApi
try:
    api = YouTubeTranscriptApi()
    t = api.fetch(sys.argv[1])
    print(" ".join([x.text for x in t]))
except Exception as e:
    print("", end="")
