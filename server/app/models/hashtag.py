from pydantic import BaseModel

class Hashtag(BaseModel):
    id: str
    tag: str