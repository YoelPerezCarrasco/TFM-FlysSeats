import json
import os
from pathlib import Path

from pymongo import MongoClient


DEFAULT_COLLECTIONS = ["users", "flights", "bookings", "seats", "swaps"]


def seed_mongo() -> None:
    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongo:27017")
    mongo_database = os.getenv("MONGO_DATABASE", "sitfly")
    source_file = os.getenv("LOCAL_DB_PATH", "/app/data/local_db.json")
    reset_first = os.getenv("MONGO_SEED_RESET", "true").lower() == "true"

    source_path = Path(source_file)
    if not source_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo de datos: {source_file}")

    with source_path.open("r", encoding="utf-8") as file:
        raw_data = json.load(file)

    client = MongoClient(mongo_uri)
    db = client[mongo_database]

    for collection_name in DEFAULT_COLLECTIONS:
        collection = db[collection_name]
        documents = raw_data.get(collection_name, [])

        if reset_first:
            collection.delete_many({})

        upserted = 0
        for document in documents:
            document_id = document.get("id")
            if document_id:
                collection.replace_one({"id": document_id}, document, upsert=True)
            else:
                collection.insert_one(document)
            upserted += 1

        print(f"{collection_name}: {upserted} documentos")

    client.close()
    print("Seed Mongo completado")


if __name__ == "__main__":
    seed_mongo()
