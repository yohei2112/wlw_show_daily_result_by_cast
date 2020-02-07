main();

function main() {
  const targetBattleTypeClassNames = [
    "block_matchlog_match", // 全国対戦
/*
    "block_matchlog_astrology",
    "block_matchlog_astrology1",
    "block_matchlog_astrology2",
    "block_matchlog_ballroom",
    "block_matchlog_concert",
    "block_matchlog_training",
*/
  ];

  targetBattleTypeClassNames.forEach((targetBattleTypeClassName) => {
    console.log(targetBattleTypeClassName);
    var targetDailyLogElements = document.getElementsByClassName(targetBattleTypeClassName);
    recursiveProcessToDailyResult(targetDailyLogElements, 0);
  });
}

function recursiveProcessToDailyResult(targetDailyLogElements, index) {
  if(targetDailyLogElements.length <= index) {
    console.log("end");
    return;
  }
  get(targetDailyLogElements[index].firstElementChild.href).then((response) => {
    console.log("called index " + index + " then")
    if (response.getElementById("info_message_box") &&
        response.getElementById("info_message_box").textContent == "アクセス過多につき、閲覧を制限します。しばらくお待ちください。") {
      console.log("アクセス制限");
    } else {
      var dailyResultByCast = aggregateResultByMatchLogDocument(response, {});
      appendDailyResultByCast(dailyResultByCast, targetDailyLogElements[index]);
      recursiveProcessToDailyResult(targetDailyLogElements, ++index);
    }
  });
}

function get(url) {
  console.log("get:" + url);
  // Return a new promise.
  return new Promise(function(resolve, reject) {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.open('GET', url);
      req.responseType = "document";

      req.onload = function() {
        console.log("onload");
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
          // Resolve the promise with the response text
          console.log("resolve");
          setTimeout(()=>{resolve(req.response)}, 2000);
        }
        else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject(Error(req.statusText));
        }
      };

      // Handle network errors
      req.onerror = function() {
        reject(Error("Network Error"));
      };

      // Make the request
      req.send();
  });
}

function getResultByMatchLog(element) {
   return element.getElementsByClassName("match_icon")[0].firstElementChild.src.endsWith("icon_win.png") ? "win" : "lose";
}

function getMyCastHashByMatchLog(element) {
  return element.getElementsByClassName("match_member")[0].firstElementChild.src.slice(-36);
}

function aggregateResultByMatchLogDocument(targetDocument, result = {}) {
  [].forEach.call(targetDocument.getElementsByClassName("block_match_log"), (matchLog) => {
    if (!result[getMyCastHashByMatchLog(matchLog)]) {
      result[getMyCastHashByMatchLog(matchLog)] = {}
      result[getMyCastHashByMatchLog(matchLog)]["win"] = 0;
      result[getMyCastHashByMatchLog(matchLog)]["lose"] = 0;
    }
    result[getMyCastHashByMatchLog(matchLog)][getResultByMatchLog(matchLog)]++;
  });
  console.log(result);
  if (targetDocument.getElementsByClassName("page_block_next").length > 0) {
    var nextPageUrl = targetDocument.getElementsByClassName("page_block_next")[0].attributes.onclick.value.split("location.href=")[1].replace(/'/g, "");
    get(nextPageUrl).then((response) => {
      result = aggregateResultByMatchLogDocument(response, result);
      return result;
    });
  } else {
    return result;
  }
}

function appendDailyResultByCast(dailyResultByCasts, targetBlock) {
  targetBlock.style.backgroundPositionY = "top";
  targetBlock.style.height = 60 * (Math.ceil(Object.keys(dailyResultByCasts).length / 2) + 1) + "px";
  targetBlock.style.textAlign = "left";

  Object.keys(dailyResultByCasts).forEach((castHash) => {
    var castBlock = document.createElement("div");
    castBlock.style.padding = "20px";
    castBlock.style.textAlign = "right";
    castBlock.style.height = "60px";
    castBlock.style.width = "50%";
    castBlock.style.display = "inline-block";
    castBlock.style.backgroundImage = "url(common/img_cast/" + castHash + ")";
    castBlock.style.backgroundRepeat = "no-repeat";
    castBlock.style.backgroundPositionX = "left";
    castBlock.style.backgroundSize = "contain";
    castBlock.style.fontSize = "1rem";
    castBlock.innerHTML = (dailyResultByCasts[castHash]["win"] + dailyResultByCasts[castHash]["lose"]).toString().padStart(3, " ").replace(/ /g, "&ensp;") + "戦"
                          + dailyResultByCasts[castHash]["win"].toString().padStart(3, " ").replace(/ /g, "&ensp;") + "勝"
                          + dailyResultByCasts[castHash]["lose"].toString().padStart(3, " ").replace(/ /g, "&ensp;") + "敗"
                          + Math.floor(dailyResultByCasts[castHash]["win"] / (dailyResultByCasts[castHash]["win"] + dailyResultByCasts[castHash]["lose"]) * 100).toString().padStart(4, " ").replace(/ /g, "&ensp;") + "%";

    targetBlock.appendChild(castBlock);
  });
}
