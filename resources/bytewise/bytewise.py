from mongo import ChangeStream 



def handler(event,context):
    obj = ChangeStream.create_change_stream(operationType={'operationType': {'$in': ['insert', 'update', 'delete']}})
    return "Hello from Lambda!"


