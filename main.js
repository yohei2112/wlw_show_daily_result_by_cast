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

  getButtleTypeByUrl(url) {
    if (!url.split("type=")[1] || url.split("type=")[1].split("&")[0] == "all") return "match";
    if (url.split("type=")[1].split("&")[0] == "bb") return "ball";
    return url.split("type=")[1].split("&")[0];
  }

  aggregateResultByMatchLogDocument(
    targetDocument,
    targetBattleTypeClassName,
    targetDailyLogElement,
    dailyResultByCast = {}
  ) {
    const battleType = this.getButtleTypeByUrl(targetDocument.URL);
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
      (targetDailyLogElement.clientHeight - 4) / 3 + "px";

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
          2) +
      "px";
    targetDailyLogElement.style.textAlign = "left";

    Object.keys(
      dailyResultByCast[targetDate][targetBattleTypeClassName]
    ).forEach(castHash => {
      var castBlock = document.createElement("div");
      if (castColumnCount === 2) {
        castBlock.style.display = "inline-block";
        castBlock.style.width = "50%";
      }
      castBlock.style.fontSize = "1.2em";
      castBlock.style.lineHeight = targetBlockHeight + "px";
      castBlock.style.height = targetBlockHeight + "px";
      castBlock.style.textAlign = "right";

      var resultTable = document.createElement("table");
      resultTable.style.width = castColumnCount === 2 ? "100%" : "80%";
      resultTable.style.margin = "auto";
      var resultTableRow = document.createElement("tr");
      var resultTableDataBase = document.createElement("td");
      resultTableDataBase.style.width = "18%";
      var resultTableDataImg = resultTableDataBase.cloneNode(true);
      var resultTableDataTotal = resultTableDataBase.cloneNode(true);
      var resultTableDataWin = resultTableDataBase.cloneNode(true);
      var resultTableDataLose = resultTableDataBase.cloneNode(true);
      var resultTableDataRate = resultTableDataBase.cloneNode(true);
      resultTableDataRate.style.width = "24%";

      var castImage = document.createElement("img");
      castImage.src = "common/img_cast/" + castHash;
      castImage.style.margin = "auto";
      castImage.style.display = "block";
      castImage.style.height = targetBlockHeight + "px";
      resultTableDataImg.appendChild(castImage);

      const winCount =
        dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
          "win"
        ];
      const loseCount =
        dailyResultByCast[targetDate][targetBattleTypeClassName][castHash][
          "lose"
        ];
      const totalCount = winCount + loseCount;

      resultTableDataTotal.innerHTML =
        "<span style='color:#000;'>" +
        totalCount +
        "</span><span style='font-size:0.6em;'>戦</span>";
      resultTableDataWin.innerHTML =
        "<span style='color:#a50000;'>" +
        winCount +
        "</span><span style='font-size:0.6em;'>勝</span>";
      resultTableDataLose.innerHTML =
        "<span style='color:#007ae1;'>" +
        loseCount +
        "</span><span style='font-size:0.6em;'>敗</span>";
      resultTableDataRate.innerHTML =
        Math.floor((winCount / totalCount) * 100) +
        "<span style='font-size:0.6em;'>%</span>";

      resultTableRow.appendChild(resultTableDataImg);
      resultTableRow.appendChild(resultTableDataTotal);
      resultTableRow.appendChild(resultTableDataWin);
      resultTableRow.appendChild(resultTableDataLose);
      resultTableRow.appendChild(resultTableDataRate);
      resultTable.appendChild(resultTableRow);
      castBlock.appendChild(resultTable);
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
      targetDailyLogElement.clientHeight * 3 + 4 + "px";

    const totalCount = targetDailyLogElement.getElementsByClassName(
      "matchlog_list_total"
    )[0].textContent;
    const winCount = targetDailyLogElement.getElementsByClassName(
      "matchlog_list_win"
    )[0].textContent;
    const totalWinRateDiv = document.createElement("div");
    totalWinRateDiv.style.textAlign = "center";
    totalWinRateDiv.style.margin = "4px 0 0";
    totalWinRateDiv.innerHTML =
      "全体勝率 " + Math.floor((winCount / totalCount) * 100) + "%";
    targetDailyLogElement.appendChild(totalWinRateDiv);

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
    if (
      !location.href.startsWith("https://wonderland-wars.net/matchlog_sub.html")
    ) {
      alert("対戦履歴画面で実行してください");
      return;
    }
    const targetBattleTypeClassNames = [
      "block_matchlog_match", // 全国対戦
      "block_matchlog_astrology1",
      "block_matchlog_concert",
      "block_matchlog_ballroom",
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
        this.addShowCastResultsButton(targetBlock, targetBattleTypeClassName);
      });
    });
  }
}

const myClass = new showDailyResultByCastAtMatchLog();
myClass.main();
