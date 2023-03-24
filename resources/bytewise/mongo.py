import pymongo
from pymongo import MongoClient
import json

class ChangeStream:
  def __init__(self, mongo_uri, database, s3_bucket, collection="People"):
    self.mongoClient = mongo_uri
    self.database = database
    self.collection = collection
    self.s3_bucket = s3_bucket
  
    self.client = MongoClient(self.mongoClient)
    self.database = self.client[self.database]
    self.collection = self.database[self.collection]

  def create_change_stream(self, operationType = {}):
    self.change_stream = self.collection.watch(pipeline=[{"$match": operationType}], full_document="updateLookup")
    for change in self.change_stream:
      changed_data_json = json.dumps(change['fullDocument'])
      object_key = f"{self.database.name}/{self.collection.name}/{change['_id']}.json"
      self.s3_client.put_object(
          Bucket=self.s3_bucket,
          Key=object_key,
          Body=changed_data_json
      )
  
  def terminate_change_stream(self):
    self.change_stream.close()