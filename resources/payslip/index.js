const chromium = require("chrome-aws-lambda");
const AWS = require('aws-sdk');
const hbs = require("handlebars");
const fs = require("fs-extra");
const path = require("path");
const mysql = require("mysql2/promise");
const QRCode = require("qrcode");
const bwipjs = require("bwip-js");



// const queue_url = process.env.queue_url_markaz_airwaybills;
const payslip_bucket=process.env.payslip_bucket;



const compile = async function (templateName, data) {
  const filePath = path.join(process.cwd(), "templates", `${templateName}.hbs`);
  const html = fs.readFileSync(filePath, "utf8");
  return hbs.compile(html)(data);
};

exports.handler = async (event, context) => {
  console.log(event);
  try {
    // launch a new chrome instance
    for (const record of event.Records) {
      const message = JSON.parse(record.body);
      console.log(message);
      companyName = message.companyName;
      pageSubtitle=message.pageSubtitle;
      employeeName=message.employeeName;
      employeeID=message.employeeID;
      department=message.department;
      description=message.description;
      amount=message.amount;
      totalAmount=message.totalAmount;

      const browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: true,
        ignoreHTTPSErrors: true,});

        dataJson={}
        dataJson.companyName=companyName;   
        dataJson.pageSubtitle=pageSubtitle;
        dataJson.employeeName=employeeName;
        dataJson.employeeID=employeeID;
        dataJson.department=department;
        dataJson.description=description;
        dataJson.amount=amount;
        dataJson.totalAmount=totalAmount;


    const page = await browser.newPage();

    const content = await compile("payslip", dataJson);

    await page.setContent(content);

    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        selectors.map((img) => {
          if (img.complete) return;
          return new Promise((resolve, reject) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", reject);
          });
        })
      );
    });

    // Generate a .pdf file
    const pdfBuffer = await page.pdf({
      format: "A4",
      // landscape mode
      landscape: true,
    });

    const today = new Date();
    const s3Path=`payslips/${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}/${employeeName}/${employeeID}`
    const s3FileName=`${dataJson.trackingId}.pdf`

    // Upload the PDF to Amazon S3.
    const s3 = new AWS.S3();
    const s3Params = {
      Bucket: payslip_bucket,
      Key: `${s3Path}/${s3FileName}`,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    };

    await s3.upload(s3Params).promise();

    // close the browser
    await browser.close();

    // generate a Pre Signed URL for the PDF file 
    const s3Params2 = {
      Bucket: payslip_bucket,
      Key: `${s3Path}/${s3FileName}`,
      Expires: 60 * 5,
    };
    const url = await s3.getSignedUrlPromise("getObject", s3Params2);
    // delete message from queue
    const deleteParams = {
      QueueUrl: queue_url,
      ReceiptHandle: record.receiptHandle,
    };
    return {
      statusCode: 200,
      body: 'Here is your Payslip',
      url: url,
    };
  }

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: 'An error occurred while generating or uploading the PDF',
    };
  }
};


// async function generateQRCodeBase64(trackingId, width, height) {
//   try {
//     const qrCodeDataURL = await QRCode.toDataURL(trackingId, {
//       width: width,
//       height: height,
//     });
//     return qrCodeDataURL;
//   } catch (error) {
//     console.error("Error generating QR code:", error);
//     throw error;
//   }
// }

// function textToBarCodeBase64 (text) {
//   return new Promise((resolve, reject) => {
//       bwipjs.toBuffer({
//           bcid: 'code128',
//           text: text,
//           height: 25,
//           width: 155,
//           includetext: false,
//           textxalign: 'center'
//       }, function(error, buffer) {
//           if(error) {
//               reject(error)
//           } else {
//               let gifBase64 = `data:image/gif;base64,${buffer.toString('base64')}`
//               resolve(gifBase64)
//           }
//       })
//   })
// }