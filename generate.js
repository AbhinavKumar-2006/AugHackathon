const puppeteer = require("puppeteer");
const path = require("path");
const cors = require('cors');
const fs = require("fs");
const express = require('express');
const app = express();
app.use(express.json());
app.use(cors());
async function generatePDF(data, designChoice) {
    const template = fs.readFileSync(`./templates/${designChoice}.html`, "utf8");
    const filledTemplate = template
        .replace(/{{full_name}}/g, data.full_name || "")
        .replace(/{{job_title}}/g, data.job_title || "")
        .replace(/{{email}}/g, data.email || "")
        .replace(/{{phone}}/g, data.phone || "")
        .replace(/{{location}}/g, data.location || "")
        .replace(/{{linkedin}}/g, data.linkedin || "")
        .replace(/{{twitter}}/g, data.twitter || "")
        .replace(/{{recipient_name}}/g, data.recipient_name || "")
        .replace(/{{recipient_title}}/g, data.recipient_title || "")
        .replace(/{{recipient_company}}/g, data.recipient_company || "")
        .replace(/{{recipient_location}}/g, data.recipient_location || "")
        .replace(/{{recipient_email}}/g, data.recipient_email || "")
        // body text will keep line breaks because of CSS white-space: pre-wrap
        .replace(/{{body}}/g, data.body || "")
        // arrays joined with comma or bullet separator
        .replace(/{{skills_list}}/g, 
                    Array.isArray(data.skills) ? data.skills.map(skill => `<li>${skill}</li>`).join("") : ""
                )
        .replace(/{{projects_list}}/g, 
            Array.isArray(data.projects) ? data.projects.map(project => `<li>${project}</li>`).join("") : "")
        .replace(/{{college}}/g , data.college);
        
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        executablePath: puppeteer.executablePath(), // ensures Puppeteer uses the downloaded Chromium
    });
    const page = await browser.newPage();
    await page.setContent(filledTemplate, { waitUntil: "networkidle0" });
    await page.pdf({ path: `${designChoice}_cover_letter.pdf`, format: "A4" });
    await browser.close();

    console.log(`${designChoice} cover letter PDF created!`);
}


app.get("/getpdf" ,async (req , res)=>{
    const design = req.query.design;
    const userData = req.body;

    const pdfFilename = `${design}_cover_letter.pdf`;
    const pdfPath = path.join(__dirname, pdfFilename);


    await generatePDF(userData , design);

    res.sendFile(pdfPath , (err) => {
        if (err) {
        console.error("Error sending PDF:", err);
        res.status(500).send("Failed to send PDF");
      } else {
        // Optionally delete the PDF after sending to save space
        fs.unlink(pdfPath, (unlinkErr) => {
          if (unlinkErr) console.error("Failed to delete PDF:", unlinkErr);
        });
      }
    })

});


app.listen(4000 , ()=>{
    console.log("i am listening at port 4000");
})