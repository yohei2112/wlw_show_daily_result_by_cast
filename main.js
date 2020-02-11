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
        console.log("onload");
        // This is called even on 404 etc
        // so check the status
        if (req.status == 200) {
          // Resolve the promise with the response text
          console.log("resolve");
          setTimeout(() => {
            resolve(req.response);
          }, 1500);
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
    console.log("targetDocument " + targetDocument);
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
      console.log("hasNextPage");
      this.get(this.getNextPageUrl(targetDocument)).then(response => {
        this.aggregateResultByMatchLogDocument(
          response,
          targetBattleTypeClassName
        );
      });
    } else {
      console.log("hasntNextPage");
    }
  }

  appendDailyResultByCast(targetDailyLogElements, targetBattleTypeClassName) {
    [].forEach.call(targetDailyLogElements, targetBlock => {
      var targetDate = targetBlock.firstElementChild.href.slice(-10);
      var targetBlockHeight = targetBlock.clientHeight;
      targetBlock.style.backgroundPositionY = "top";
      targetBlock.style.height =
        targetBlockHeight *
          (Object.keys(
            this.dailyResultByCast[targetDate][targetBattleTypeClassName]
          ).length +
            1) +
        "px";
      targetBlock.style.textAlign = "left";

      Object.keys(
        this.dailyResultByCast[targetDate][targetBattleTypeClassName]
      ).forEach(castHash => {
        var castBlock = document.createElement("div");
        castBlock.style.padding = Math.floor(targetBlockHeight / 3) + "px";
        castBlock.style.textAlign = "right";
        castBlock.style.height = targetBlockHeight + "px";
        castBlock.style.backgroundImage =
          "url(common/img_cast/" + castHash + ")";
        castBlock.style.backgroundRepeat = "no-repeat";
        castBlock.style.backgroundPositionX = "left";
        castBlock.style.backgroundSize = "contain";
        castBlock.style.fontSize = "1rem";
        castBlock.innerHTML =
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
          "戦" +
          this.dailyResultByCast[targetDate][targetBattleTypeClassName][
            castHash
          ]["win"]
            .toString()
            .padStart(3, " ")
            .replace(/ /g, "&ensp;") +
          "勝" +
          this.dailyResultByCast[targetDate][targetBattleTypeClassName][
            castHash
          ]["lose"]
            .toString()
            .padStart(3, " ")
            .replace(/ /g, "&ensp;") +
          "敗" +
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
          "%";

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
        } else {
          this.aggregateResultByMatchLogDocument(
            response,
            targetBattleTypeClassName
          );
          if (targetDailyLogElements.length - 1 === index) {
            setTimeout(() => {
              this.appendDailyResultByCast(
                targetDailyLogElements,
                targetBattleTypeClassName
              );
            }, 2000);
            console.log("end");
            console.log(this.dailyResultByCast);
            return;
          } else {
            this.recursiveProcessToDailyResult(
              targetDailyLogElements,
              targetBattleTypeClassName,
              ++index
            );
          }
        }
      }
    );
  }

  main() {
    const targetBattleTypeClassNames = [
      "block_matchlog_match", // 全国対戦
      "block_matchlog_astrology1"
      /*
          "block_matchlog_astrology",
          "block_matchlog_astrology1",
          "block_matchlog_astrology2",
          "block_matchlog_ballroom",
          "block_matchlog_concert",
          "block_matchlog_training",
      */
    ];

    targetBattleTypeClassNames.forEach(targetBattleTypeClassName => {
      console.log("targetBattleTypeClassNames: " + targetBattleTypeClassName);
      var targetDailyLogElements = document.getElementsByClassName(
        targetBattleTypeClassName
      );
      this.recursiveProcessToDailyResult(
        targetDailyLogElements,
        targetBattleTypeClassName
      );
    });
  }
}

const myClass = new showDailyResultByCastAtMatchLog();
myClass.main();
