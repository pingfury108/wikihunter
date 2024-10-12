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

function parseSpeciesMd(tab) {
  let trs = {};
  console.log("data", tab);
  tab.find("tbody > tr").each(function (el) {
    console.log("tr children: ", el.children.length)
    if (el.children.length == 2) {
      let [k, v] = el.textContent.split("\n\n").map(function (s) {
        return s.trim().replace(":", "").replace("：", "")
      })
      trs[k] = v;
    }
  });
  console.log("trs md: ", trs);
  return trs
}

function parseMd(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  console.log(doc_u);
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".infobox.biota");

  let title = doc_u.find(".mw-page-title-main").text().trim();

  let md = parseSpeciesMd(tab);

  let item = {
    metadata: md,
    title: title,
  };

  let content_p = content.find("p").first();
  if (content_p) {
    item["describe"] = content_p.textContent.trim();
  } else {
    item["describe"] = ""
  }
  return item
}

function parseMdEn(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  console.log(doc_u);
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".infobox.biota");
  let md = parseSpeciesMd(tab);
  let title = doc_u.find(".mw-page-title-main").text().trim();

  let item = {
    metadata: md,
    title: title,
  };

  let content_p = content.find("p:not(.mw-empty-elt)").first();
  if (content_p) {
    item["describe"] = content_p.textContent.trim();
  } else {
    item["describe"] = ""
  }
  return item
}


function parseMdfr(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  console.log(doc_u);
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".infobox.biota");
  let md = parseSpeciesMd(tab);
  let title = doc_u.find(".mw-page-title-main").text().trim();

  let item = {
    metadata: md,
    title: title,
  };

  let content_p = content.find("p:not(.mw-empty-elt)").first();
  if (content_p) {
    item["describe"] = content_p.textContent.trim();
  } else {
    item["describe"] = ""
  }
  return item
}

function parseMdes(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  console.log(doc_u);
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".infobox.biota");
  let md = parseSpeciesMd(tab);
  let title = doc_u.find(".mw-page-title-main").text().trim();

  let item = {
    metadata: md,
    title: title,
  };

  let content_p = content.find("p:not(.mw-empty-elt)").first();
  if (content_p) {
    item["describe"] = content_p.textContent.trim();
  } else {
    item["describe"] = ""
  }
  return item
}

function OptionsIndex() {
  const [data, setData] = useState("")
  const [result, setResult] = useState([])

  const se = function (kw: String) {
    (async () => {
      let html_text_zh = await search(kw, "zh");
      let html_text_en = await search(kw, "en");
      let html_text_fr = await search(kw, "fr");
      let html_text_es = await search(kw, "es");
      let zh_md = parseMd(html_text_zh);
      let en_md = parseMdEn(html_text_en);
      let fr_md = parseMdfr(html_text_fr);
      let es_md = parseMdfr(html_text_es);
      let item = {
        "name": kw,
        "zh": zh_md,
        "en": en_md,
        "fr": fr_md,
        "es": es_md
      };
      console.log("item: ", item);
      setResult([item]);
    })();
  }

  const ItemList = () => {
    return (
      <tbody>
        {result.map((item, index) => (
          <tr key={index}>
            <th>{index + 1}</th>  {/* 序号 */}
            <td>{item.name}</td> {/* 学名 */}
            <td>{item.en.title}</td> {/* 名称(en)*/}
            <td>{item.en.metadata["Family"]}</td> {/* 科名(en) */}
            <td>{item.en.metadata["Genus"]}</td> {/* 属名(en) */}
            <td>{item.en.describe}</td> {/* 描述(en)*/}
            <td>{item.zh.title}</td>  {/* 名称(zh)*/}
            <td>{item.zh.metadata["科"]}</td> {/* 科名(zh) */}
            <td>{item.zh.metadata["属"]}</td> {/* 属名(zh) */}
            <td>{item.zh.describe}</td> {/* 描述(zh)*/}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className="w-screen h-screen">
      <div className="navbar bg-base-100">
        <a className="btn btn-ghost text-xl">维基猎手</a>
      </div>
      <div className="container mx-auto p-8">
        <label className="input input-bordered flex items-center gap-2">
          <input type="text" className="grow" placeholder="Search" onChange={(e) => setData(e.target.value)} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
            onClick={(e) => se(data)}
          >
            <path
              fillRule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clipRule="evenodd" />
          </svg>
        </label>
        <div className="mt-4">
          <div className="overflow-x-auto">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>学名</th>

                  <th>名称(en)</th>
                  <th>科名(en)</th>
                  <th>属名(en)</th>
                  <th>描述(en)</th>

                  <th>名称(zh)</th>
                  <th>科名(zh)</th>
                  <th>属名(zh)</th>
                  <th>描述(zh)</th>
                </tr>
              </thead>
              <ItemList />
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptionsIndex
