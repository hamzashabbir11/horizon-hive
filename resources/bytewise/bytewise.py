import pandas as pd

def handler(event,context):
    s3 = boto3.client('s3')
    bucket_name = 'bilal-email-bucket'
    file_key = 'target_state_table (3).csv'
    obj = s3.get_object(Bucket=bucket_name, Key=file_key)
    
    data = pd.read_csv(obj['Body'])
    sns_topic_arn = 'arn:aws:sns:ap-southeast-1:748941532207:bilal-email-test'
    
    if ((~ (data['status'] == 'LOADED')).any() or (data['error'] != 'None').any() or (data['load_date'] != datetime.date.today().strftime('%Y-%m-%d')).all()):
        message = "Glue ETL Job has failed or timedout, please check and resolve the issues."
        subject = "Glue ETL Job Failed"
        sns_client = boto3.client('sns')
        response = sns_client.publish(TopicArn = sns_topic_arn, Subject=subject, Message = message)
   
    return "Hello from Lambda!"


