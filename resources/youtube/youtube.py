from pytube import YouTube
import boto3

def handler(event,context):
    url=event['pathParameters']['link']
    video_url = url
    yt = YouTube(video_url)
    video_stream = yt.streams.get_highest_resolution()
    download_path = 'hamza.mp4'
    video_stream.download(output_path=download_path)
    s3 = boto3.client('s3')
    bucket_name = 'bilal-email-bucket'
    file_key = 'hamza.mp4'
    s3.upload_file(download_path, bucket_name, file_key)
    return "File uploaded to S3"


 

