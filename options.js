document.addEventListener("DOMContentLoaded", async () => {
  const enableAdvanced = document.getElementById("enableAdvanced");
  const groupContainer = document.getElementById("groupContainer");
  const addGroupBtn = document.getElementById("addGroupBtn");
  const highlightWords = document.getElementById("highlightWords");
  const highlightColor = document.getElementById("highlightColor");
  const textColor = document.getElementById("textColor");
  const exportBtn = document.getElementById("exportBtn");
  const importInput = document.getElementById("importInput");
  const form = document.getElementById("settingsForm");

  // 設定読込
  chrome.storage.sync.get(null, (data) => {
    enableAdvanced.checked = data.enableAdvanced || false;
    groupContainer.style.display = enableAdvanced.checked ? "block" : "none";
    highlightWords.disabled = enableAdvanced.checked;
    highlightColor.value = data.highlightColor || "#ffff00";
    textColor.value = data.textColor || "#000000";

    if (data.groups && Array.isArray(data.groups)) {
      data.groups.forEach((group, index) => addGroup(group, index));
    }

    if (!enableAdvanced.checked) {
      highlightWords.value = data.highlightWords || "";
    }
  });

  // インポートボタン
  enableAdvanced.addEventListener("change", () => {
    groupContainer.style.display = enableAdvanced.checked ? "block" : "none";
    highlightWords.disabled = enableAdvanced.checked;
  });

  // グループ追加ボタン
  addGroupBtn.addEventListener("click", () => {
    addGroup();
  });

  // 保存
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newSettings = {
      enableAdvanced: enableAdvanced.checked,
    };

    if (enableAdvanced.checked) {
      const groups = Array.from(document.querySelectorAll(".group")).map(
        (el) => {
          return {
            name: el.querySelector(".groupName").value,
            highlightWords: el.querySelector(".highlightWords").value,
            ignoreWords: el.querySelector(".ignoreWords").value,
            useRegex: el.querySelector(".useRegex").value,
            highlightColor: el.querySelector(".highlightColor").value,
            textColor: el.querySelector(".textColor").value,
          };
        }
      );
      newSettings.groups = groups;
    } else {
      newSettings.highlightWords = highlightWords.value;
      newSettings.highlightColor = highlightColor.value;
      newSettings.textColor = textColor.value;
    }
  });

  // json出力
  exportBtn.addEventListener("click", async () => {
    const data = await new Promise((resolve) =>
      chrome.storage.sync.get(null, resolve)
    );
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "modassist-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // インポートファイル選択時の処理
  importInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (confirmImport) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        chrome.storage.sync.set(data, () => {
          alert("設定をインポートしました。ページをリロードしてください。");
        });
      } catch (err) {
        alert("無効な設定ファイルです。");
      }
    }
  });

    // グループ追加
  function addGroup(data = {}, index = Date.now()) {
    const group = document.createElement("div");
    group.className = "group";
    group.style.border = "1px solid #ccc";
    group.style.marginBottom = "10px";
    group.style.padding = "10px";

    // グループ内HTML
    const header = document.createElement("div");
    header.innerHTML = `
      <strong>グループ:</strong> <input type="text" class="groupName" value="${
        data.name || ""
      }" placeholder="グループ名" />
      <button type="button" class="toggleBtn">▼</button>
      <button type="button" class="removeBtn" style="color:red; float:right;">ー</button>
    `;
    group.appendChild(header);

    const content = document.createElement("div");
    content.className = "groupContent";
    content.innerHTML = `
      <label>強調表示ワード</label>
      <textarea class="highlightWords" rows="2">${
        data.highlightWords || ""
      }</textarea>

      <label>無視ワード</label>
      <textarea class="ignoreWords" rows="2">${
        data.ignoreWords || ""
      }</textarea>

      <label>正規表現を使う</label>
      <select class="useRegex">
        <option value="true" ${data.useRegex === "true" ? "selected" : ""}>使用する</option>
        <option value="false" ${data.useRegex !== "true" ? "selected" : ""}>使用しない</option>
      </select>

      <div style="margin-top: 10px;">
        <label>背景色</label>
        <input type="color" class="highlightColor" value="${data.highlightColor || "#ffff00"}" />

        <label>文字色</label>
        <input type="color" class="textColor" value="${data.textColor || "#000000"}" />
      </div>
    `;

    group.appendChild(content);

    group.querySelector(".removeBtn").addEventListener("click", () => {
      if (confirm("このグループを削除しますか？")) {
        group.remove();
      }
    });

    group.querySelector(".toggleBtn").addEventListener("click", () => {
      group.classList.toggle("collapsed");
    });
    
    groupContainer.appendChild(group);
  }
});
