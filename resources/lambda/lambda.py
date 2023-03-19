import json

name="MY_NAME"

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps(f'Hello from {name}!')
    }