class showDailyResultByCastAtMatchLog {
  constructor() {
    this.dailyResultByCast = {};
  }

  get(url) {
    console.log("get:" + url);
    // Return a new promise.
    return new Promise(function(resolve, reject) {
      // Do the usual XHR stuff
      var req = new XMLHttpRequest();
      req.open("GET", url);
      req.responseType = "document";

      req.onload = function() {
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
          // Resolve the promise with the response text
          setTimeout(() => {
            resolve(req.response);
          }, 500);
        } else {
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
  getResultByMatchLog(element, battleType) {
    return element
      .getElementsByClassName(`${battleType}_icon`)[0]
      .firstElementChild.src.endsWith("icon_win.png")
      ? "win"
      : "lose";
  }

  getMyCastHashByMatchLog(element) {
    return element
      .getElementsByClassName("match_member")[0]
      .firstElementChild.src.slice(-36);
  }

  hasNextPage(targetDocument) {
    return (
      targetDocument.getElementsByClassName("page_block_page_on")[0] &&
      targetDocument
        .getElementsByClassName("page_block_page_on")[0]
        .nextElementSibling.classList.contains("page_block_page")
    );
  }

  getNextPageUrl(targetDocument) {
    return targetDocument
      .getElementsByClassName("page_block_page_on")[0]
      .nextElementSibling.attributes.onclick.value.split("location.href=")[1]
      .replace(/'/g, "");
  }

  aggregateResultByMatchLogDocument(targetDocument, targetBattleTypeClassName) {
    const battleType = targetDocument.URL.split("type=")[1]
      ? targetDocument.URL.split("type=")[1].split("&")[0]
      : "match";
    [].forEach.call(
      targetDocument.getElementsByClassName(`block_${battleType}_log`),
      matchLog => {
        var matchDate = matchLog
          .getElementsByClassName(`${battleType}_date`)[0]
          .innerText.slice(0, 10);
        if (!this.dailyResultByCast[matchDate]) {
          this.dailyResultByCast[matchDate] = {};
        }
        if (!this.dailyResultByCast[matchDate][targetBattleTypeClassName]) {
          this.dailyResultByCast[matchDate][targetBattleTypeClassName] = {};
        }
        if (
          !this.dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ]
        ) {
          this.dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ] = {};
          this.dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ]["win"] = 0;
          this.dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ]["lose"] = 0;
        }
        this.dailyResultByCast[matchDate][targetBattleTypeClassName][
          this.getMyCastHashByMatchLog(matchLog)
        ][this.getResultByMatchLog(matchLog, battleType)]++;
      }
    );
    if (this.hasNextPage(targetDocument)) {
      this.get(this.getNextPageUrl(targetDocument)).then(response => {
        this.aggregateResultByMatchLogDocument(
          response,
          targetBattleTypeClassName
        );
      });
    }
  }

  appendDailyResultByCast(targetDailyLogElements, targetBattleTypeClassName) {
    [].forEach.call(targetDailyLogElements, targetBlock => {
      var targetDate = targetBlock.firstElementChild.href.slice(-10);
      var targetBlockHeight = targetBlock.clientHeight;
      targetBlock.style.backgroundPositionY = "top";
      var castColumnCount = targetBlockHeight === 60 ? 2 : 1;
      targetBlock.style.height =
        targetBlockHeight *
          (Math.ceil(
            Object.keys(
              this.dailyResultByCast[targetDate][targetBattleTypeClassName]
            ).length / castColumnCount
          ) +
            1) +
        "px";
      targetBlock.style.textAlign = "left";

      Object.keys(
        this.dailyResultByCast[targetDate][targetBattleTypeClassName]
      ).forEach(castHash => {
        var castBlock = document.createElement("div");
        if (targetBlockHeight === 60) {
          castBlock.style.display = "inline-block";
          castBlock.style.width = "50%";
          castBlock.style.padding = "0 0 0 50px";
        } else {
          castBlock.style.fontSize = "1.1rem";
          castBlock.style.margin = "0 0 0 30px"
        }
        castBlock.style.lineHeight = targetBlockHeight + "px";
        castBlock.style.height = targetBlockHeight + "px";
        castBlock.style.textAlign = "center";
        castBlock.style.backgroundImage =
          "url(common/img_cast/" + castHash + ")";
        castBlock.style.backgroundRepeat = "no-repeat";
        castBlock.style.backgroundPositionX = "left";
        castBlock.style.backgroundSize = "contain";
        castBlock.innerHTML =
          "<span style='color:#000;'>" +
          (
            this.dailyResultByCast[targetDate][targetBattleTypeClassName][
              castHash
            ]["win"] +
            this.dailyResultByCast[targetDate][targetBattleTypeClassName][
              castHash
            ]["lose"]
          )
            .toString()
            .padStart(3, " ")
            .replace(/ /g, "&ensp;") +
          "</span><span style='font-size:0.6em;'>戦</span><span style='color:#a50000;'>" +
          this.dailyResultByCast[targetDate][targetBattleTypeClassName][
            castHash
          ]["win"]
            .toString()
            .padStart(3, " ")
            .replace(/ /g, "&ensp;") +
          "</span><span style='font-size:0.6em;'>勝</span><span style='color:#007ae1;'>" +
          this.dailyResultByCast[targetDate][targetBattleTypeClassName][
            castHash
          ]["lose"]
            .toString()
            .padStart(3, " ")
            .replace(/ /g, "&ensp;") +
          "</span><span style='font-size:0.6em;'>敗</span>" +
          Math.floor(
            (this.dailyResultByCast[targetDate][targetBattleTypeClassName][
              castHash
            ]["win"] /
              (this.dailyResultByCast[targetDate][targetBattleTypeClassName][
                castHash
              ]["win"] +
                this.dailyResultByCast[targetDate][targetBattleTypeClassName][
                  castHash
                ]["lose"])) *
              100
          )
            .toString()
            .padStart(4, " ")
            .replace(/ /g, "&ensp;") +
          "<span style='font-size:0.6em;'>%</span>";

        targetBlock.appendChild(castBlock);
      });
    });
  }

  recursiveProcessToDailyResult(
    targetDailyLogElements,
    targetBattleTypeClassName,
    index = 0
  ) {
    this.get(targetDailyLogElements[index].firstElementChild.href).then(
      response => {
        console.log("called index " + index + " then");
        if (
          response.getElementById("info_message_box") &&
          response.getElementById("info_message_box").textContent ==
            "アクセス過多につき、閲覧を制限します。しばらくお待ちください。"
        ) {
          console.log("アクセス制限");
          alert("アクセスが制限されています  ")
        } else if (
          response.getElementById("info_message_box") &&
          response.getElementById("info_message_box").textContent ==
            "ログアウトしました。"
        ) {
          console.log("ログアウト");
          alert("ログアウトしていますログインしてから再実行してください")
        } else {
          this.aggregateResultByMatchLogDocument(
            response,
            targetBattleTypeClassName
          );
          if (targetDailyLogElements.length - 1 === index) {
            console.log("end");
            console.log(this.dailyResultByCast);
            setTimeout(() => {
              this.appendDailyResultByCast(
                targetDailyLogElements,
                targetBattleTypeClassName
              );
            }, 2000);
            setTimeout(() => {
              this.getTargetDailyLogElementsAndProcess(targetBattleTypeClassName)
            }, 1000);
          } else {
            return this.recursiveProcessToDailyResult(
              targetDailyLogElements,
              targetBattleTypeClassName,
              ++index
            );
          }
        }
      }
    );
  }

  getTargetDailyLogElementsAndProcess(targetBattleTypeClassName) {
    const targetBattleTypeClassNames = [
      "block_matchlog_match", // 全国対戦
      "block_matchlog_astrology1",
      "block_matchlog_concert"
      /*
          "block_matchlog_astrology",
          "block_matchlog_astrology1",
          "block_matchlog_astrology2",
          "block_matchlog_ballroom",
          "block_matchlog_concert",
          "block_matchlog_training",
      */
    ];
    var index = targetBattleTypeClassName ? targetBattleTypeClassNames.indexOf(targetBattleTypeClassName) + 1 : 0;
    if (targetBattleTypeClassNames.length == index) return;
    var targetBattleTypeClassName = targetBattleTypeClassNames[index]
    var targetDailyLogElements = document.getElementsByClassName(
      targetBattleTypeClassName
    );
    this.recursiveProcessToDailyResult(
      targetDailyLogElements,
      targetBattleTypeClassName
    )
  }

  main() {
    this.getTargetDailyLogElementsAndProcess();
  }
}

const myClass = new showDailyResultByCastAtMatchLog();
myClass.main();
