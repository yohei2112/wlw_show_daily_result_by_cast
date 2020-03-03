class showDailyResultByCastAtMatchLog {
  get(url) {
    console.log("get:" + url);
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();
      req.open("GET", url);
      req.responseType = "document";

      req.onload = function() {
        if (req.status == 200) {
          setTimeout(() => {
            resolve(req.response);
          }, 300);
        } else {
          reject(Error(req.statusText));
        }
      };

      req.onerror = function() {
        reject(Error("Network Error"));
      };

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

  aggregateResultByMatchLogDocument(
    targetDocument,
    targetBattleTypeClassName,
    targetDailyLogElement,
    dailyResultByCast = {}
  ) {
    const battleType = targetDocument.URL.split("type=")[1]
      ? targetDocument.URL.split("type=")[1].split("&")[0]
      : "match";
    [].forEach.call(
      targetDocument.getElementsByClassName(`block_${battleType}_log`),
      matchLog => {
        var matchDate = matchLog
          .getElementsByClassName(`${battleType}_date`)[0]
          .innerText.slice(0, 10);
        if (!dailyResultByCast[matchDate]) {
          dailyResultByCast[matchDate] = {};
        }
        if (!dailyResultByCast[matchDate][targetBattleTypeClassName]) {
          dailyResultByCast[matchDate][targetBattleTypeClassName] = {};
        }
        if (
          !dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ]
        ) {
          dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ] = {};
          dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ]["win"] = 0;
          dailyResultByCast[matchDate][targetBattleTypeClassName][
            this.getMyCastHashByMatchLog(matchLog)
          ]["lose"] = 0;
        }
        dailyResultByCast[matchDate][targetBattleTypeClassName][
          this.getMyCastHashByMatchLog(matchLog)
        ][this.getResultByMatchLog(matchLog, battleType)]++;
      }
    );
    if (this.hasNextPage(targetDocument)) {
      this.get(this.getNextPageUrl(targetDocument)).then(response => {
        this.aggregateResultByMatchLogDocument(
          response,
          targetBattleTypeClassName,
          targetDailyLogElement,
          dailyResultByCast
        );
      });
    } else {
      new showDailyResultByCastAtMatchLog().appendDailyResultByCast(
        targetDailyLogElement,
        targetBattleTypeClassName,
        dailyResultByCast
      );
    }
  }

  appendDailyResultByCast(
    targetDailyLogElement,
    targetBattleTypeClassName,
    dailyResultByCast
  ) {
    targetDailyLogElement.getElementsByClassName("appended-button")[0].remove();
    targetDailyLogElement.style.height =
      targetDailyLogElement.clientHeight / 2 + "px";

    var targetDate = targetDailyLogElement.firstElementChild.href.slice(-10);
    var targetBlockHeight = targetDailyLogElement.clientHeight;
    targetDailyLogElement.style.backgroundPositionY = "top";
    var castColumnCount = targetBlockHeight === 60 ? 2 : 1;
    targetDailyLogElement.style.height =
      targetBlockHeight *
        (Math.ceil(
          Object.keys(dailyResultByCast[targetDate][targetBattleTypeClassName])
            .length / castColumnCount
        ) +
          1) +
      "px";
    targetDailyLogElement.style.textAlign = "left";

    Object.keys(
      dailyResultByCast[targetDate][targetBattleTypeClassName]
    ).forEach(castHash => {
      var castBlock = document.createElement("div");
      if (targetBlockHeight === 60) {
        castBlock.style.display = "inline-block";
        castBlock.style.width = "50%";
        castBlock.style.padding = "0 0 0 50px";
      } else {
        castBlock.style.fontSize = "1.1rem";
        castBlock.style.margin = "0 0 0 30px";
      }
      castBlock.style.lineHeight = targetBlockHeight + "px";
      castBlock.style.height = targetBlockHeight + "px";
      castBlock.style.textAlign = "center";
      castBlock.style.backgroundImage = "url(common/img_cast/" + castHash + ")";
      castBlock.style.backgroundRepeat = "no-repeat";
      castBlock.style.backgroundPositionX = "left";
      castBlock.style.backgroundSize = "contain";
      castBlock.innerHTML =
        "<span style='color:#000;'>" +
        (
          dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
            "win"
          ] +
          dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
            "lose"
          ]
        )
          .toString()
          .padStart(3, " ")
          .replace(/ /g, "&ensp;") +
        "</span><span style='font-size:0.6em;'>戦</span><span style='color:#a50000;'>" +
        dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
          "win"
        ]
          .toString()
          .padStart(3, " ")
          .replace(/ /g, "&ensp;") +
        "</span><span style='font-size:0.6em;'>勝</span><span style='color:#007ae1;'>" +
        dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
          "lose"
        ]
          .toString()
          .padStart(3, " ")
          .replace(/ /g, "&ensp;") +
        "</span><span style='font-size:0.6em;'>敗</span>" +
        Math.floor(
          (dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
            "win"
          ] /
            (dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
              "win"
            ] +
              dailyResultByCast[targetDate][targetBattleTypeClassName][
                castHash
              ]["lose"])) *
            100
        )
          .toString()
          .padStart(4, " ")
          .replace(/ /g, "&ensp;") +
        "<span style='font-size:0.6em;'>%</span>";

      targetDailyLogElement.appendChild(castBlock);
    });
  }

  processToDailyResult(e) {
    var targetDailyLogElement = this.targetDailyLogElement;
    var targetBattleTypeClassName = this.targetBattleTypeClassName;
    new showDailyResultByCastAtMatchLog()
      .get(targetDailyLogElement.firstElementChild.href)
      .then(response => {
        if (
          response.getElementById("info_message_box") &&
          response.getElementById("info_message_box").textContent ==
            "アクセス過多につき、閲覧を制限します。しばらくお待ちください。"
        ) {
          console.log("アクセス制限");
          alert("アクセスが制限されています  ");
        } else if (
          response.getElementById("info_message_box") &&
          response.getElementById("info_message_box").textContent ==
            "ログアウトしました。"
        ) {
          console.log("ログアウト");
          alert("ログアウトしていますログインしてから再実行してください");
        } else {
          new showDailyResultByCastAtMatchLog().aggregateResultByMatchLogDocument(
            response,
            targetBattleTypeClassName,
            targetDailyLogElement
          );
        }
      });
  }

  addShowCastResultsButton(targetDailyLogElement, targetBattleTypeClassName) {
    targetDailyLogElement.style.backgroundPositionY = "top";
    targetDailyLogElement.style.height =
      targetDailyLogElement.clientHeight * 2 + "px";

    var showCastResultsButton = document.createElement("button");
    showCastResultsButton.textContent = "キャスト別勝敗数を表示";
    showCastResultsButton.classList.add("appended-button");
    showCastResultsButton.style.margin = "5px";
    showCastResultsButton.addEventListener("click", {
      handleEvent: this.processToDailyResult,
      targetDailyLogElement: targetDailyLogElement,
      targetBattleTypeClassName: targetBattleTypeClassName
    });

    targetDailyLogElement.appendChild(showCastResultsButton);
  }

  main() {
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
    [].forEach.call(targetBattleTypeClassNames, targetBattleTypeClassName => {
      var targetDailyLogElements = document.getElementsByClassName(
        targetBattleTypeClassName
      );
      [].forEach.call(targetDailyLogElements, targetBlock => {
        this.addShowCastResultsButton(targetBlock, "block_matchlog_match");
      });
    });
  }
}

const myClass = new showDailyResultByCastAtMatchLog();
myClass.main();
