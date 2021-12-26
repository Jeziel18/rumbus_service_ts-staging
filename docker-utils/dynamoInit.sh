aws dynamodb create-table \
--table-name device_otp \
--attribute-definitions AttributeName=device_id,AttributeType=S \
--key-schema AttributeName=device_id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000

aws dynamodb create-table \
--table-name Etas \
--attribute-definitions AttributeName=trip_id,AttributeType=S \
--key-schema AttributeName=trip_id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000

aws dynamodb create-table \
--table-name News \
--attribute-definitions AttributeName=id,AttributeType=S \
--key-schema AttributeName=id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000

aws dynamodb create-table \
--table-name Passenger_count \
--attribute-definitions AttributeName=trip_id,AttributeType=S \
--key-schema AttributeName=trip_id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000

aws dynamodb create-table \
--table-name Route \
--attribute-definitions AttributeName=route_id,AttributeType=S \
--key-schema AttributeName=route_id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000

aws dynamodb create-table \
--table-name Stop \
--attribute-definitions AttributeName=lat,AttributeType=N AttributeName=lon,AttributeType=N \
--key-schema AttributeName=lat,KeyType=HASH AttributeName=lon,KeyType=RANGE \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000

aws dynamodb create-table \
--table-name Trip_history \
--attribute-definitions AttributeName=trip_id,AttributeType=S \
--key-schema AttributeName=trip_id,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
--endpoint-url http://dynamodb:8000
