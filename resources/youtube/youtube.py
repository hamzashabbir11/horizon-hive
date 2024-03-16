from pytube import YouTube
import boto3
import json
import os


YOUTUBE_BUCKET=os.environ['YOUTUBE_BUCKET']



def handler(event,context):
    print(event)
    data=json.loads(event['body'])
    url=data['url']
    video_url = url
    yt = YouTube(video_url)
    video_stream = yt.streams.get_highest_resolution()
    download_path = '/tmp/'
    video_stream.download(output_path=download_path)
    s3 = boto3.client('s3')
    bucket_name = YOUTUBE_BUCKET
    for file in os.listdir(download_path):
        if file.endswith('.mp4'):
            s3.upload_file(download_path+file, bucket_name, file)
            print('File uploaded to S3')
 

