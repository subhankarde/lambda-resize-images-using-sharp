const im = require('sharp');
const fs = require('fs');
const os = require('os');
const { uuid } = require('uuidv4');
const {promisify} = require('util');
const AWS = require('aws-sdk');
const { Buffer } = require('buffer');
const readFileAsync = promisify(fs.readFile)
const unlinkFileAsync = promisify(fs.unlink)

AWS.config.update({region: 'us-east-1'});

const s3 = new AWS.S3();

exports.handler = async (event)  =>{
    let filesProcessd = event.Records.map(async(records)=>{
        let bucket = records.s3.bucket.name;
        let filename = records.s3.object.key;

        console.log('bucket name', bucket)
        console.log('bucket name', filename)

      //Get file from S3
      var sourceBucketParams = {
            Bucket: bucket,
            Key: filename
      }

      let inputData = await s3.getObject(sourceBucketParams).promise();
      let tempFile = os.tmpdir()+'/' + uuid() + '.jpg'
      await im(inputData.Body).resize(200).toFile(tempFile)
      const resizeFile = await readFileAsync(tempFile)
      const  targetFileName = filename.substring(0, filename.lastIndexOf('.')) +'-small.jpg'
      console.log('targetFileName ', targetFileName)
      var destBucketName=bucket.substring(0, bucket.lastIndexOf('-'))  + '-dest'
      
      var destinationBucketParams ={
        Bucket: destBucketName,
        Key: targetFileName,
        Body: new Buffer.from(resizeFile),
        ContentType: 'image/jpeg' 
      }
      await s3.putObject(destinationBucketParams).promise()
      return await unlinkFileAsync(tempFile)
    });
    await Promise.all(filesProcessd);
    console.log("done");
    return "done";
}