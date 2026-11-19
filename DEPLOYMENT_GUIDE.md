# PrismMBTI 新手完整發佈教學指南（GitHub Pages & Google Cloud Platform）

這份指南專為第一次接觸網站發佈的新手設計，帶你一步一步把 **PrismMBTI** 放到網路上，讓 **電腦與手機只要點開網址就能直接使用測驗與 200% JPG 報告匯出**。

---

## 一、發佈方案比較（新手該選哪一個？）

| 方案 | 難度 | 費用 | 特色與適用情境 |
| :--- | :--- | :--- | :--- |
| **方案 A：GitHub Pages（最推薦新手）** | ⭐ 最簡單 | **完全免費**（免綁信用卡） | 只要執行一次設定，以後每次 `git push` 就自動測試並上線成公開 `https://` 網址，支援手機相簿儲存 JPG。 |
| **方案 B：Google Cloud Storage 靜態網站** | ⭐⭐ 中等 | 依流量計費（有免費額度，需綁計費帳號） | Google Cloud 官方最經濟的純靜態網頁託管方式，適合已有 GCP 計費專案的使用者。 |
| **方案 C：Google Cloud Run** | ⭐⭐⭐ 進階 | 依請求計費（閒置可縮至 0，有免費額度） | 將網站包裝為容器服務跑在 GCP 上，適合未來想擴充後端 API 或統一用 GCP 管理微服務。 |

> 💡 **小提醒**：本專案目前已為你打包好離線通用的單檔網頁（`dist/PrismMBTI.html`，需在本機執行 `npm run build:html` 產生），不想架站時也可直接傳到手機點擊開啟。

---

## 二、目前已為你準備好的工具與專案設定

系統已經幫你完成以下前置工作：

1. **已安裝所需指令工具**：
   - `Git`
   - `GitHub CLI`（`gh` v2.105.0）
   - `Google Cloud SDK`（`gcloud` v594.0.0）
2. **已建立自動化設定檔**：
   - `.gitignore`：自動排除暫存與大型執行檔（`build/`、`dist/`、`__pycache__/`）。
   - `.github/workflows/deploy-pages.yml`：GitHub Actions 自動化腳本，每次推送程式碼到 `main` 分支，就會自動執行 `npm test` 測試、打包單檔版並部署上線。
3. **已完成本地 Git 初始化**：
   - 本地 `main` 分支已建立初始提交，並綁定遠端目標 `https://github.com/knstbp/PrismMBTI.git`。

> ⚠️ **重要第一步**：因為 `gh` 與 `gcloud` 是剛剛才新安裝的，請先 **關閉原本的終端機 / PowerShell，再重新開一個新的終端機**，系統才會載入這兩個新指令的路徑。

開啟新終端機後，先切到專案資料夾：

```powershell
cd "D:\Google Antigravity\MBTI"
```

---

## 三、方案 A：自動發佈到 GitHub 與 GitHub Pages（推薦新手從這裡開始）

### 步驟 1：登入你的 GitHub 帳號

在終端機輸入：

```powershell
gh auth login
```

接著依照畫面上的問題用方向鍵與 `Enter` 選擇：
1. *Where do you use GitHub?* → 選 **`GitHub.com`**
2. *What is your preferred protocol for Git operations on this host?* → 選 **`HTTPS`**
3. *Authenticate Git with your GitHub credentials?* → 選 **`Yes`**
4. *How would you like to authenticate GitHub CLI?* → 選 **`Login with a web browser`**
5. 畫面會出現一組 **8 位數驗證碼**（例如 `ABCD-1234`），按下 `Enter` 會自動開啟瀏覽器，把那組驗證碼貼上並按下 **Authorize** 授權即可。

再執行一次以下指令讓 Git 自動共用剛剛的登入憑證：

```powershell
gh auth setup-git
```

---

### 步驟 2：將本地程式推送到 GitHub

在終端機輸入：

```powershell
git push -u origin main
```

看到 `branch 'main' set up to track 'origin/main'` 即代表程式碼已成功上傳到你的 GitHub Repo！

---

### 步驟 3：開啟 GitHub Pages 自動發佈權限（只需做一次）

1. 用瀏覽器打開你的 GitHub 專案頁面：`https://github.com/knstbp/PrismMBTI`
2. 點選上方分頁 **`Settings`**（設定）→ 左側選單 **`Pages`**。
3. 在 **Build and deployment** 區塊中，將 **Source** 下拉選單改為：**`GitHub Actions`**。
4. 接著點選上方分頁 **`Actions`**：
   - 如果剛剛 push 時工作流尚未跑完或因尚未選 `GitHub Actions` 而失敗，點擊該筆紀錄右上角的 **`Re-run all jobs`**（或先到 GitHub Actions 重新觸發一次 `Deploy PrismMBTI to GitHub Pages` 的 **`Run workflow`**）。
5. 等約 30～60 秒出現綠色勾勾 ✅ 後，你的網站就正式上線了！
   - **公開網址**：`https://knstbp.github.io/PrismMBTI/`
   - **單檔版下載連結**：`https://knstbp.github.io/PrismMBTI/PrismMBTI.html`

---

### 步驟 4：以後修改程式要怎麼重新發佈？

以後只要改完任何檔案，在終端機執行這 3 行就會**全自動測試＋重新上線**：

```powershell
git add -A
git commit -m "更新測驗內容或介面"
git push
```

---

## 四、方案 B & C：發佈到 Google Cloud Platform（GCP）

> 💰 **費用與帳號提醒**：使用 Google Cloud Platform 部署對外服務前，需先有一個 Google 帳號並前往 [Google Cloud Console](https://console.cloud.google.com/) 開通計費帳號（首次註冊通常提供 $300 美元免費試用額度，建議同步設定預算通知與自動停用警示）。

### 步驟 1：登入 Google Cloud 帳號

在新的 PowerShell 終端機執行：

```powershell
gcloud auth login
```

瀏覽器會自動跳出 Google 帳號登入畫面，登入後點擊「允許」即可完成授權。

---

### 步驟 2：選擇（或建立）GCP 專案並確認計費帳號

先查看目前帳號下是否已經有可用專案：

```powershell
gcloud projects list --filter="lifecycleState=ACTIVE" --limit=20
```

- **如果已有專案**：記下它的 `PROJECT_ID`，設為預設工作專案：

  ```powershell
  gcloud config set project <你的PROJECT_ID>
  ```

- **如果還沒有專案**：先建立新專案（`PROJECT_ID` 必須全球唯一，只能用小寫英文、數字與連字號 `-`，長度 6～30 字元）：

  ```powershell
  gcloud projects create prism-mbti-<你的學號或代號> --name="PrismMBTI" --set-as-default --quiet
  ```

接著查看可用的計費帳號 ID，並將它連結到你的專案：

```powershell
gcloud billing accounts list --filter="open=true" --limit=10
gcloud billing projects link <你的PROJECT_ID> --billing-account=<你的BILLING_ACCOUNT_ID> --quiet
```

---

### 步驟 3-A：發佈為 Google Cloud Storage 靜態網站（GCP 最推薦做法）

Cloud Storage 非常適合本專案這種純 HTML/CSS/JS 前端網頁，步驟如下（請將 `<你的全球唯一Bucket名稱>` 換成例如 `prism-mbti-knstbp-web`）：

1. **建立儲存桶（設於台灣機房 `asia-east1`，並關閉公開存取封鎖）**：

   ```powershell
   gcloud storage buckets create gs://<你的全球唯一Bucket名稱> --location=asia-east1 --no-public-access-prevention --uniform-bucket-level-access --project=<你的PROJECT_ID>
   ```

2. **設定靜態網站預設首頁為 `index.html`**：

   ```powershell
   gcloud storage buckets update gs://<你的全球唯一Bucket名稱> --web-main-page-suffix=index.html --web-error-page=index.html --project=<你的PROJECT_ID>
   ```

3. **允許所有訪客公開檢視網頁檔案**：

   ```powershell
   gcloud storage buckets add-iam-policy-binding gs://<你的全球唯一Bucket名稱> --member=allUsers --role=roles/storage.objectViewer --project=<你的PROJECT_ID>
   ```

4. **上傳網站檔案**：

   ```powershell
   gcloud storage cp index.html styles.css gs://<你的全球唯一Bucket名稱> --project=<你的PROJECT_ID>
   gcloud storage cp --recursive src assets gs://<你的全球唯一Bucket名稱> --project=<你的PROJECT_ID>
   ```

5. **完成！開啟公開測試網址**：
   - `https://storage.googleapis.com/<你的全球唯一Bucket名稱>/index.html`

---

### 步驟 3-B：發佈至 Google Cloud Run（進階容器版）

若你需要使用 Cloud Run 的 `*.run.app` 專屬網址：

1. **先啟用 Cloud Run 與 Cloud Build API**：

   ```powershell
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com --project=<你的PROJECT_ID> --quiet
   ```

2. **在專案根目錄建立極簡靜態網頁 `Dockerfile`**（讓 Nginx 監聽 Cloud Run 要求的環境變數 `$PORT`，預設 `8080`）：

   ```dockerfile
   FROM nginx:alpine
   COPY index.html styles.css /usr/share/nginx/html/
   COPY src /usr/share/nginx/html/src
   COPY assets /usr/share/nginx/html/assets
   CMD ["/bin/sh", "-c", "sed -i \"s/listen  *80;/listen ${PORT:-8080};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
   ```

3. **一鍵建置並發佈到台北機房（`asia-east1`）**：

   ```powershell
   gcloud run deploy prism-mbti --source . --region=asia-east1 --allow-unauthenticated --project=<你的PROJECT_ID> --quiet
   ```

4. 部署完成後，終端機最後會印出 `Service URL: https://prism-mbti-xxxxxx.a.run.app`，電腦與手機都能直接開啟該網址。

---

## 五、新手常見問題（FAQ）

1. **輸入 `gh` 或 `gcloud` 時出現「無法辨識詞彙 / command not found」？**
   - 請先完全關閉目前的終端機或 VS Code 終端機分頁，再重新開啟一個新的視窗。
2. **`git push` 失敗或說沒有權限？**
   - 請確認執行過 `gh auth login` 與 `gh auth setup-git`，並且你登入的 GitHub 帳號必須是 `https://github.com/knstbp/PrismMBTI` 的擁有者（`knstbp`）。
3. **GitHub Pages 網站打開顯示 404 Not Found？**
   - 確認 Repo `Settings` → `Pages` → `Source` 選的是 **`GitHub Actions`**，而不是 `Deploy from a branch`，並在 `Actions` 分頁確認工作流已執行成功。
4. **想檢查本地測試是否正常再發佈？**
   - 在專案根目錄執行 `npm test`（目前共有 11 項單元測試）確認全部通過即可安心推送。
