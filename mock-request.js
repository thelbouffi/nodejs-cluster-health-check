const http = require("http");
const gets = (url) =>
  new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
const api = async () => {
  return gets("http://localhost:3033/slow");
};

let promises = [];
for (let i = 0; i < 10; i++) {
  promises.push(api());
}

(async () => console.log(await Promise.all(promises)))();
