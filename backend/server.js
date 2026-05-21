const express = require("express");
const cors = require("cors");
const faqs = require("./faq.json");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", (req, res) => {

  const message = req.body.message.toLowerCase();

  let reply = "Sorry, I don't understand.";

  faqs.forEach(faq => {
    faq.keywords.forEach(keyword => {
      if (message.includes(keyword)) {
        reply = faq.answer;
      }
    });
  });

  res.json({ reply });

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});