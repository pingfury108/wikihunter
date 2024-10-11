import { useState } from "react";
import u from "umbrellajs";
import "./style.css";


async function search(keyword, lang) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&format=json&srlimit=1`; // 只取第一个结果
  const response = await fetch(url);
  const data = await response.json();

  if (data.query && data.query.search && data.query.search.length > 0) {
    const pageTitle = data.query.search[0].title;
    const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;

    // 获取页面内容，这部分需要处理可能存在的跨域问题
    const pageResponse = await fetch(pageUrl);
    const pageText = await pageResponse.text();
    return pageText
  }
  return ""
}

function parseMd(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  console.log(doc_u);
  let content = doc_u.find("#mw-content-text");
  console.log("data",content.find(".infobox.biota").textContent);
  let content_p = content.find("p").first();
  if (content_p) {
    return content_p.textContent
  }
  return ""
}

function parseMdEn(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  console.log(doc_u);
  let content = doc_u.find("#mw-content-text").find("p").nodes[1];
  if (content) {
    return content.textContent
  }
  return ""
}

function OptionsIndex() {
  const [data, setData] = useState()
  const [result, setResult] = useState("")

  const se = function (e) {
    (async () => {
      let html_text_zh = await search(data, "zh");
      let html_text_en = await search(data, "en");
      let zh_md = parseMd(html_text_zh);
      let en_md = parseMdEn(html_text_en);
      setResult(`${zh_md}\n${en_md}`);
    })();
  }

  return (
    <div className="w-screen h-screen">
      <div className="navbar bg-base-100">
        <a className="btn btn-ghost text-xl">维基百科猎手</a>
      </div>
      <div className="container mx-auto p-8">
        <label className="input input-bordered flex items-center gap-2">
          <input type="text" className="grow" placeholder="Search" onChange={(e) => setData(e.target.value)} value={data} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
            onClick={se}
          >
            <path
              fillRule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clipRule="evenodd" />
          </svg>
        </label>
        <div className="mt-4 text-center">
          <p id="searchResults" className="text-lg whitespace-pre-wrap">{result}</p>
        </div>
      </div>
    </div>
  )
}

export default OptionsIndex
