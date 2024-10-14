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
    return [pageText, pageUrl]
  }
  return ["", ""]
}

async function searchSpecies(keyword) {
  const url = `https://species.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&format=json&srlimit=1`; // 只取第一个结果
  const response = await fetch(url);
  const data = await response.json();

  if (data.query && data.query.search && data.query.search.length > 0) {
    const pageTitle = data.query.search[0].title;
    const pageUrl = `https://species.wikimedia.org/wiki/${encodeURIComponent(pageTitle)}`;

    // 获取页面内容，这部分需要处理可能存在的跨域问题
    const pageResponse = await fetch(pageUrl);
    const pageText = await pageResponse.text();
    return [pageText, pageUrl]
  }
  return ["", ""]
}

async function searchCommons(keyword) {
  const url = `https://commons.wikimedia.org/w/api.php?srsearch=${encodeURIComponent(keyword)}&title=Special%3AMediaSearch&go=Go&wprov=acrw1_0`; // 只取第一个结果
  const response = await fetch(url);
  const pageText = await response.text();
  return [pageText, url]
}

function parseSpeciesMd(tab) {
  let trs = {};
  tab.find("tbody > tr").each(function (el) {
    if (el.children.length == 2) {
      let [k, v] = el.textContent.split("\n\n").map(function (s) {
        return s.trim().replace(":", "").replace("：", "")
      })
      trs[k] = v;
    }
  });
  return trs
}

function parseMdSpecies(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  let title = doc_u.find("#firstHeading").text().trim();
  let content = doc_u.find(".mw-content-ltr.mw-parser-output");

  let item = {
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

function parseMd(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
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
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".infobox.biota");
  let md = parseSpeciesMd(tab);
  let title = doc_u.find("#firstHeading").text().trim();

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
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".taxobox_classification");
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

function parseSpeciesMdEs(tab) {
  let trs = {};
  let doc = u(tab);
  doc.find("tbody > tr").each(function (el) {
    if (el.children.length == 2) {
      let [k, v] = el.textContent.split("\n").map(function (s) {
        return s.trim().replace(":", "").replace("：", "")
      })
      trs[k] = v;
    }
  });
  return trs
}

function parseMdes(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let doc_u = u(doc.body.children);
  let content = doc_u.find("#mw-content-text");
  let tab = content.find(".infobox").nodes[0];
  let md = parseSpeciesMdEs(tab);
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
  const [data, setData] = useState([])
  const [result, setResult] = useState([])
  const [item, setItem] = useState(null)

  const se = async function (e) {
    let items = [];
    setResult([]);
    setItem(null);
    for (const kw of data) {
      console.log("search kw: ", kw, items);
      let [html_text_species, species_url] = await searchSpecies(kw);
      let [html_text_img, imag_url] = await searchCommons(kw);
      let [html_text_zh, zh_url] = await search(kw, "zh");
      let [html_text_en, en_url] = await search(kw, "en");
      let [html_text_fr, fr_url] = await search(kw, "fr");
      let [html_text_es, es_url] = await search(kw, "es");

      let species_md = parseMdSpecies(html_text_species);
      let zh_md = parseMd(html_text_zh);
      let en_md = parseMdEn(html_text_en);
      let fr_md = parseMdfr(html_text_fr);
      let es_md = parseMdes(html_text_es);
      let item = {
        "name": species_md.title,
        "species_url": species_url,
        "zh": zh_md,
        "zh_url": zh_url,
        "en": en_md,
        "en_url": en_url,
        "fr": fr_md,
        "fr_url": fr_url,
        "es": es_md,
        "es_url": es_url,
        "img_url": imag_url,
      };
      console.log("item: ", item);
      items.push(item);
    }
    setResult(items);
  }

  const ItemList = ({ result }) => {
    if (result.length > 0) {
      return (
        <div className="h-96">
          {result.map((item, index) => (
            <div key={index} tabIndex={index} className="collapse collapse-arrow w-full">
              <div className="collapse-title">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>序号</th>
                      <th>学名</th>
                      <th>名称(en)</th>
                      <th>科名(en)</th>
                      <th>属名(en)</th>
                      <th>名称(zh)</th>
                      <th>科名(zh)</th>
                      <th>属名(zh)</th>
                      <th>名称(fr)</th>
                      <th>科名(fr)</th>
                      <th>属名(fr)</th>
                      <th>名称(es)</th>
                      <th>科名(es)</th>
                      <th>属名(es)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th>{index + 1}</th>  {/* 序号 */}
                      <td><span>{item.name}</span></td> {/* 学名 */}
                      <td><span>{item.en.title}</span></td> {/* 名称(en)*/}
                      <td><span>{item.en.metadata["Family"]}</span></td> {/* 科名(en) */}
                      <td><span>{item.en.metadata["Genus"]}</span></td> {/* 属名(en) */}
                      <td><span>{item.zh.title}</span></td>  {/* 名称(zh)*/}
                      <td><span>{item.zh.metadata["科"]}</span></td> {/* 科名(zh) */}
                      <td><span>{item.zh.metadata["属"]}</span></td> {/* 属名(zh) */}
                      <td><span>{item.fr.title}</span></td>  {/* 名称(fr)*/}
                      <td><span>{item.fr.metadata["Ordre"]}</span></td> {/* 科名(fr) */}
                      <td><span>{item.fr.metadata["Famille"]}</span></td> {/* 属名(fr) */}
                      <td><span>{item.es.title}</span></td>  {/* 名称(es)*/}
                      <td><span>{item.es.metadata["Familia"]}</span></td> {/* 科名(es) */}
                      <td><span>{item.es.metadata["Género"]}</span></td> {/* 属名(es) */}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="collapse-content">
                <ItemDescibe item={item} />
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div>
        </div>
      )
    }

  };

  const ItemDescibe = ({ item }) => {
    if (item) {
      return (
        <div>
          <div className="p-3">
            <div className="badge badge-primary badge-outline text-xs">中文原站内容</div>
            <iframe src={item.zh_url} sandbox="allow-scripts allow-same-origin" className="w-full h-96"></iframe>
          </div>
          <div className="p-3">
            <div className="badge badge-primary badge-outline text-xs">英文原站内容</div>
            <iframe src={item.en_url} sandbox="allow-scripts allow-same-origin" className="w-full h-96"></iframe>
          </div>
          <div className="p-3">
            <div className="badge badge-primary badge-outline text-xs">法语原站内容</div>
            <iframe src={item.fr_url} sandbox="allow-scripts allow-same-origin" className="w-full h-96"></iframe>
          </div>
          <div className="p-3">
            <div className="badge badge-primary badge-outline text-xs">西班牙语原站内容</div>
            <iframe src={item.es_url} sandbox="allow-scripts allow-same-origin" className="w-full h-96" ></iframe>
          </div>
          <div className="p-3">
            <div className="badge badge-primary badge-outline text-xs">科学信息原站内容</div>
            <iframe src={item.species_url} sandbox="allow-scripts allow-same-origin" className="w-full h-96" ></iframe>
          </div>
        </div>
      )
    } else {
      return <></>
    }

  }

  return (
    <div className="w-screen h-screen">
      <div className="navbar bg-base-100">
        <a className="btn btn-ghost text-xl">维基猎手</a>
      </div>
      <div className="container mx-auto p-8">
        <div className="flex gap-2 item-center input-bordered">
          <textarea className="textarea textarea-bordered w-full grow h-4" placeholder="请输入搜索内容..."
            onChange={(e) => setData(e.target.value.trim().split("\n"))}
          ></textarea>
          <button className="btn" onClick={async (e) => await se(e)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-70"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd" />
            </svg></button>
        </div>
        <div className="mt-4 h-full w-full">
          <ItemList result={result} />
        </div>
      </div>
    </div >
  )
}

export default OptionsIndex
