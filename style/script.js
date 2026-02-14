const grid = document.getElementById("grid");
const previewGrid = document.getElementById("previewGrid");
const colorPicker = document.getElementById("colorPicker");
const titleInput = document.getElementById("titleInput");
const nameInput = document.getElementById("nameInput");
const editView = document.getElementById("editView");
const historyContainer = document.getElementById('colorHistory');
const submitButton = document.getElementById("submitButton");
const backButton = document.getElementById("backButton");
const titleError = document.getElementById("titleError");
const confirmButton = document.getElementById("confirmButton");
const overlay = document.getElementById("overlay");


const PIXEL_COUNT = 4 * 4

// ページネーション用
// const POSTS_PER_PAGE = 21;
let currentPage = 1;
let allPosts = [];



// 4x4 = 16マス生成
for (let i = 0; i < PIXEL_COUNT; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";

    // クリックで色を塗る
    cell.addEventListener("click", () => {
        const color = colorPicker.value;
        cell.style.backgroundColor = color; // 見た目
        cell.dataset.color = color; // 保存用
    });

    grid.appendChild(cell);
}


// タイトルが入力されていないときに、「確認」ボタンを押されたときワーニングを表示
// そのあと、利用者が入力しようとしたときにワーニングを解除
titleInput.addEventListener("input", () => {
    if (titleInput.value.trim() !== "") {
        titleError.style.display = "none";
    }
});

// 確認画面生成
document.addEventListener("DOMContentLoaded", () => {

    confirmButton.addEventListener("click", () => {
        if (titleInput.value.trim() === "") {
            titleError.style.display = "block";
            titleInput.focus();
            return;
        }

        previewGrid.innerHTML = "";

        getPixels().flat().forEach(color => {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.style.backgroundColor = color;
            previewGrid.appendChild(cell);
        });

        const nameValue = nameInput.value.trim(); // 前後の空白も削除
        previewName.textContent = nameValue !== "" ? nameValue : "（名無し）";
        previewTitle.textContent = titleInput.value;
        
        overlay.classList.remove("hidden");
    });

    backButton.addEventListener("click", () => {
        overlay.classList.add("hidden");
    });

});




// 最終投稿チェック
submitButton.onclick = async () => {

    // 二重送信防止
    submitButton.disabled = true;
    submitButton.textContent = "投稿中…";
    submitButton.classList.add("is-submitting"); // ボタンをくすませる

    // 戻るボタン無効
    backButton.disabled = true;
    backButton.classList.add("is-submitting");

    const nameValue = nameInput.value.trim();
    const payload = {
        title: titleInput.value,
        name: nameValue !== "" ? nameValue : "（名無し）",
        image: pixelsToBase64(getPixels())
    };

    try {
        await fetch(GAS_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
      });

      alert("投稿完了！");
      location.reload();

    } catch (e) {
        // 失敗時は復活
        submitButton.disabled = false;
        alert("投稿に失敗しました。もう一度お試しください。");
    }
};



// ここをかえろおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおおお
// 過去投稿取得用
document.addEventListener("DOMContentLoaded", loadHistory);
// document.addEventListener("DOMContentLoaded", loadHistoryFromFile);


const GAS_URL = "https://script.google.com/macros/s/AKfycbwvNO9jkZAdVxhoPqEd-pFYClcNz8S4CfVSCqPer4P5rq6H5PdNlSlYD3d3NYXCHqmPHQ/exec";







/* -------------------------- */
/* 過去投稿表示用 */
/* -------------------------- */

// 1. ページネーション無し
function renderHistory(posts) {
    const container = document.getElementById("historyList");
    container.innerHTML = "";

    const POST_COUNT = 200
    posts.slice(0, POST_COUNT).forEach((post, i) => {
        const item = document.createElement("div");
        item.className = "history-item";

        const card = document.createElement("div");
        card.className = "history-card";

        // 表
        const front = document.createElement("div");
        front.className = "card-face card-front";

        const grid = document.createElement("div");
        grid.className = "history-grid";

        post.pixels.forEach(color => {
            const cell = document.createElement("div");
            cell.className = "history-cell";
            cell.style.backgroundColor = color;
            grid.appendChild(cell);
        });

        const title = document.createElement("div");
        title.className = "history-item-title";
        title.textContent = post.title;

        front.appendChild(grid);
        front.appendChild(title);

        // 裏
        const back = document.createElement("div");
        back.className = "card-face card-back";
        back.innerHTML = `作<br>${post.name}`;

        card.appendChild(front);
        card.appendChild(back);
        item.appendChild(card);
        container.appendChild(item);
    });
}


// 2. ページネーションあり
function renderHistory_pagination(posts, page = 1) {
    const container = document.getElementById("historyList");
    container.innerHTML = "";

    // カードの列数を取得
    const POSTS_PER_PAGE = getPostsPerPage();

    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;

    const pagePosts = posts.slice(start, end);

    pagePosts.forEach(post => {

        const item = document.createElement("div");
        item.className = "history-item";

        const card = document.createElement("div");
        card.className = "history-card";

        const front = document.createElement("div");
        front.className = "card-face card-front";

        const grid = document.createElement("div");
        grid.className = "history-grid";

        post.pixels.forEach(color => {
            const cell = document.createElement("div");
            cell.className = "history-cell";
            cell.style.backgroundColor = color;
            grid.appendChild(cell);
        });

        const title = document.createElement("div");
        title.className = "history-item-title";
        title.textContent = post.title;

        front.appendChild(grid);
        front.appendChild(title);

        const back = document.createElement("div");
        back.className = "card-face card-back";
        back.innerHTML = `作<br>${post.name}`;

        card.appendChild(front);
        card.appendChild(back);
        item.appendChild(card);
        container.appendChild(item);
    });

    renderPagination(posts.length, page);
}

function renderPagination(totalPosts, currentPage) {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    const POSTS_PER_PAGE = getPostsPerPage();
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    const maxVisible = 5; // 表示する最大ページ数
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    // 調整（最後まで表示できるように）
    if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
    }

    // ← 前へ
    if (currentPage > 1) {
        const prev = createPageButton("←", currentPage - 1);
        pagination.appendChild(prev);
    }

    // 1ページ目省略処理
    if (start > 1) {
        pagination.appendChild(createPageButton(1, 1));
        if (start > 2) {
            pagination.appendChild(createDots());
        }
    }

    // メインページ番号
    for (let i = start; i <= end; i++) {
        const btn = createPageButton(i, i);
        if (i === currentPage) {
            btn.classList.add("active");
        }
        pagination.appendChild(btn);
    }

    // 最終ページ省略処理
    if (end < totalPages) {
        if (end < totalPages - 1) {
            pagination.appendChild(createDots());
        }
        pagination.appendChild(createPageButton(totalPages, totalPages));
    }

    // 次へ →
    if (currentPage < totalPages) {
        const next = createPageButton("→", currentPage + 1);
        pagination.appendChild(next);
    }
}

function createPageButton(text, page) {
    const btn = document.createElement("button");
    btn.textContent = text;

    btn.onclick = () => {
        currentPage = page;
        renderHistory_pagination(allPosts, currentPage);

        // ページネーションのボタンを押したら、<div id="pagination">まで移動する
        document.getElementById("pagination").scrollIntoView({
            behavior: "smooth"
        });
    };
    return btn;
}

function createDots() {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className = "dots";
    return span;
}


// 2.1 過去投稿カードの表示枚数を戻す
function getPostsPerPage() {
    const container = document.getElementById("historyList");

    const columns = getComputedStyle(container)
        .gridTemplateColumns
        .split(" ").length;

    const MAX_CARDS = 28;
    const DEFAULT_ROWS = 6;

    // 通常の表示数
    let rows = DEFAULT_ROWS;
    let total = columns * rows;

    // 最大枚数を超えるなら段数を減らす
    if (total > MAX_CARDS) {
        rows = Math.floor(MAX_CARDS / columns);
        total = columns * rows;
    }

    return total;
}

// 2.2 windowサイズ変更時にも2.1を対応
let resizeTimer;
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
        const newWidth = window.innerWidth;

        if (newWidth !== lastWidth) {
            lastWidth = newWidth;
            renderHistory_pagination(allPosts, currentPage);
        }
    }, 200);
});



/* -------------------------- */
/* 過去投稿カードひっくり返す処理 */
/* -------------------------- */
let flippedItem = null;
document.addEventListener("click", (e) => {
    
    const clickedItem = e.target.closest(".history-item");

    // ① カードをクリックした場合
    if (clickedItem) {

        // すでに開いているか判定
        const isOpen = clickedItem.classList.contains("is-flipped");

        // 一旦全部閉じる
        document.querySelectorAll(".history-item").forEach(item => {
        item.classList.remove("is-flipped");
        });

        // 開いていなかった場合だけ開く
        if (!isOpen) {
        clickedItem.classList.add("is-flipped");
        }

    } 
    // ② カード以外をクリックした場合
    else {
        document.querySelectorAll(".history-item").forEach(item => {
        item.classList.remove("is-flipped");
        });
    }
});









/* ------------------------------- */
/* 過去投稿 取得用 -> 表示関数使用 */
/* ------------------------------- */

// A) GASから取得
async function loadHistory() {
    const res = await fetch(GAS_URL);
    const rawPosts = await res.json();

    // GASデータ(b64) → 表示(hex) 変換
    const posts = rawPosts
        .reverse()
        .map(post => ({
            title: post.title,
            name: post.name,
            pixels: post.image ? base64ToPixels(post.image) : null
        }))
        .filter(post => post.title && post.name && post.pixels);
    
    // 昔
    // renderHistory(posts);

    // 今
    allPosts = posts;
    renderHistory_pagination(posts, 1);

}

// B) jsonリストから取得
async function loadHistoryFromFile() {
    const res = await fetch("image/history.json");
    const rawPosts = await res.json();

    // 新着順
    const posts = rawPosts
        .reverse()
        .map(post => ({
            title: post.title,
            name: post.name,
            pixels: post.image ? base64ToPixels(post.image) : null
        }))
        .filter(post => post.title && post.name && post.pixels);

    // 昔
    // renderHistory(posts);

    // 今
    allPosts = posts;
    renderHistory_pagination(posts, 1);
}






/* ------------------------------ */
/* 4x4画像 エンコーダ・デコーダ用 */
/* ------------------------------ */

// pixels -> B64 (投稿用)
function pixelsToBase64(pixels) {
    const bytes = new Uint8Array(PIXEL_COUNT * 3);

    pixels.forEach((hex, i) => {
        const rgb = hex.replace("#", "");
        bytes[i * 3 + 0] = parseInt(rgb.slice(0, 2), 16);
        bytes[i * 3 + 1] = parseInt(rgb.slice(2, 4), 16);
        bytes[i * 3 + 2] = parseInt(rgb.slice(4, 6), 16);
    });

    // Uint8Array → binary string → Base64
    let binary = "";
    bytes.forEach(b => binary += String.fromCharCode(b));

    return btoa(binary);
}

// B64 -> pixels (表示用)
function base64ToPixels(b64) {

    const binary = atob(b64);
    const pixels = [];

    for (let i = 0; i < PIXEL_COUNT; i++) {
        const r = binary.charCodeAt(i * 3);
        const g = binary.charCodeAt(i * 3 + 1);
        const b = binary.charCodeAt(i * 3 + 2);

        const color =
            "#" +
            r.toString(16).padStart(2, "0") +
            g.toString(16).padStart(2, "0") +
            b.toString(16).padStart(2, "0");

        pixels.push(color);
    }

    return pixels;
}

// 静的html画面 -> データ(hex)変換
function getPixels() {
    const cells = grid.children;
    const pixels = [];

    for (let i = 0; i < 16; i++) {
        pixels.push(cells[i].dataset.color || "#ffffff");
    }

    return pixels;
}






/* ---------------------------- */
/* 色彩履歴 */
/* ---------------------------- */
let colorHistory = [];
grid.addEventListener('click', () => {
    const color = colorPicker.value;

    colorHistory = colorHistory.filter(c => c !== color); // すでにある色は削除
    colorHistory.unshift(color); // 先頭に追加
    colorHistory = colorHistory.slice(0, 9); // N件まで

    renderColorHistory();
});

function renderColorHistory() {
    historyContainer.innerHTML = '';

    colorHistory.forEach(color => {
        const item = document.createElement('div');
        item.className = 'color-item';
        item.style.backgroundColor = color;

        item.addEventListener('click', () => {
            colorPicker.value = color;
        });

        historyContainer.appendChild(item);
    });
}


// colorPicker.addEventListener('input', () => {
//   const color = colorPicker.value;

//   colorHistory = colorHistory.filter(c => c !== color); // すでにある色は削除
//   colorHistory.unshift(color); // 先頭に追加
//   colorHistory = colorHistory.slice(0, 8); // N件まで

//   renderColorHistory();
// });

// function renderColorHistory() {
//   historyContainer.innerHTML = '';

//   colorHistory.forEach(color => {
//     const item = document.createElement('div');
//     item.className = 'color-item';
//     item.style.backgroundColor = color;

//     item.addEventListener('click', () => {
//       colorPicker.value = color;
//     });

//     historyContainer.appendChild(item);
//   });
// }