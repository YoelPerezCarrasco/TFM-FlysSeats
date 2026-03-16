.PHONY: dev dev-backend dev-frontend docker-up docker-down docker-logs mongo-up mongo-ui mongo-seed mongo-shell mongo-ls mongo-users mongo-flights mongo-swaps

dev:
	bash scripts/dev.sh

dev-backend:
	cd backend && LOCAL_MODE=true DB_MODE=mongodb python3 app.py

dev-frontend:
	cd flyseats-frontend && npm start

docker-up:
	docker compose up --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

mongo-up:
	docker compose up -d mongo redis

mongo-ui:
	@echo "Mongo Express: http://localhost:8081 (user: $${MONGO_EXPRESS_USER:-admin})"

mongo-seed:
	docker compose up -d mongo redis backend
	docker exec sitfly-backend python scripts/seed_mongo_from_local_json.py

mongo-shell:
	docker exec -it sitfly-mongo mongosh

mongo-ls:
	docker exec sitfly-mongo mongosh --quiet --eval "db = db.getSiblingDB('sitfly'); printjson(db.getCollectionNames())"

mongo-users:
	docker exec sitfly-mongo mongosh --quiet --eval "db = db.getSiblingDB('sitfly'); printjson(db.users.find().toArray())"

mongo-flights:
	docker exec sitfly-mongo mongosh --quiet --eval "db = db.getSiblingDB('sitfly'); printjson(db.flights.find().toArray())"

mongo-swaps:
	docker exec sitfly-mongo mongosh --quiet --eval "db = db.getSiblingDB('sitfly'); printjson(db.swaps.find().toArray())"
