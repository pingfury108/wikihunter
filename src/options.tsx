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
    return pageText
  }
  return ""
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
    for (const kw of data) {
      console.log("search kw: ", kw, items);
      let html_text_species = await searchSpecies(kw);
      let html_text_zh = await search(kw, "zh");
      let html_text_en = await search(kw, "en");
      let html_text_fr = await search(kw, "fr");
      let html_text_es = await search(kw, "es");

      let species_md = parseMdSpecies(html_text_species);
      let zh_md = parseMd(html_text_zh);
      let en_md = parseMdEn(html_text_en);
      let fr_md = parseMdfr(html_text_fr);
      let es_md = parseMdes(html_text_es);
      let item = {
        "name": species_md.title,
        "zh": zh_md,
        "en": en_md,
        "fr": fr_md,
        "es": es_md
      };
      console.log("item: ", item);
      items.push(item)
    }
    setResult(items);
  }

  const ItemList = () => {
    return (
      <tbody>
        {result.map((item, index) => (
          <tr key={index} onClick={() => setItem(item)}>
            <th>{index + 1}</th>  {/* 序号 */}
            <td><span>{item.name}</span></td> {/* 学名 */}

            <td><span>{item.en.title}</span></td> {/* 名称(en)*/}
            <td><span>{item.en.metadata["Family"]}</span></td> {/* 科名(en) */}
            <td><span>{item.en.metadata["Genus"]}</span></td> {/* 属名(en) */}
            {/*
            <td className=""><p>{item.en.describe}</p></td> {/* 描述(en)*/}

            <td><span>{item.zh.title}</span></td>  {/* 名称(zh)*/}
            <td><span>{item.zh.metadata["科"]}</span></td> {/* 科名(zh) */}
            <td><span>{item.zh.metadata["属"]}</span></td> {/* 属名(zh) */}
            {/*
            <td><p>{item.zh.describe}</p></td> {/* 描述(zh)*/}

            <td><span>{item.fr.title}</span></td>  {/* 名称(fr)*/}
            <td><span>{item.fr.metadata["Ordre"]}</span></td> {/* 科名(fr) */}
            <td><span>{item.fr.metadata["Famille"]}</span></td> {/* 属名(fr) */}
            {/*
            <td><span>{item.fr.describe}</span></td> {/* 描述(fr)*/}

            <td><span>{item.es.title}</span></td>  {/* 名称(es)*/}
            <td><span>{item.es.metadata["Familia"]}</span></td> {/* 科名(es) */}
            <td><span>{item.es.metadata["Género"]}</span></td> {/* 属名(es) */}
            {/*
            <td><p>{item.es.describe}</p></td> {/* 描述(es)*/}
          </tr>
        ))}
      </tbody>
    );
  };

  const ItemDescibe = () => {
    if (item) {
      return (
        <div>
          <div>
            <p>{item.zh.describe}</p>
          </div>
          <div>
            <p>{item.en.describe}</p>
          </div>
          <div>
            <p>{item.fr.describe}</p>
          </div>
          <div>
            <p>{item.es.describe}</p>
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
          <button className="btn" onClick={se}>
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
        <div className="mt-4 flex flex-row h-full">
          <div className="overflow-x-auto w-4/5 p-2">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>学名</th>

                  <th>名称(en)</th>
                  <th>科名(en)</th>
                  <th>属名(en)</th>
                  {/*
                  <th>描述(en)</th>
                  */}

                  <th>名称(zh)</th>
                  <th>科名(zh)</th>
                  <th>属名(zh)</th>
                  {/*
                  <th>描述(zh)</th>
                    */}


                  <th>名称(fr)</th>
                  <th>科名(fr)</th>
                  <th>属名(fr)</th>
                  {/*
                  <th>描述(fr)</th>
                    */}


                  <th>名称(es)</th>
                  <th>科名(es)</th>
                  <th>属名(es)</th>
                  {/*
<th>描述(es)</th>
                    */}

                </tr>
              </thead>
              <ItemList />
              <tfoot className={result.length > 20 ? '' : 'hidden'}>
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
              </tfoot>
            </table>
          </div>
          <div className="w-1/5 p-2 pt-10">
            <ItemDescibe />
          </div>
        </div>
      </div >
    </div >
  )
}

export default OptionsIndex
