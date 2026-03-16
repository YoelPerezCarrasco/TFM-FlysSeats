#!/bin/bash
# Initialize Cosmos DB collections for FlysSeats

echo "🚀 Initializing Cosmos DB collections for FlysSeats..."

# Get variables
COSMOS_NAME="flyseats2-dev-cosmos"
RESOURCE_GROUP="flyseats2-dev-rg"
DATABASE_NAME="flyseats-db"

# Create database
echo "📦 Creating database: $DATABASE_NAME"
az cosmosdb sql database create \
  --account-name $COSMOS_NAME \
  --resource-group $RESOURCE_GROUP \
  --name $DATABASE_NAME \
  --throughput 400 \
  2>/dev/null || echo "  ℹ️  Database already exists"

# Create collections
collections=("users" "flights" "seats" "swap_requests" "messages" "ratings" "location_verifications")

for collection in "${collections[@]}"; do
  echo "📊 Creating collection: $collection"
  
  az cosmosdb sql container create \
    --account-name $COSMOS_NAME \
    --resource-group $RESOURCE_GROUP \
    --database-name $DATABASE_NAME \
    --name $collection \
    --partition-key-path "/id" \
    --throughput 400 \
    2>/dev/null || echo "  ℹ️  Collection $collection already exists"
done

echo ""
echo "✅ Cosmos DB initialization complete!"
echo ""
echo "📋 Collections created:"
for collection in "${collections[@]}"; do
  echo "  - $collection"
done
echo ""
echo "🌐 Endpoint: https://$COSMOS_NAME.documents.azure.com:443/"
echo "📚 Database: $DATABASE_NAME"
