document.getElementById("entryForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const entryData = {
        type: formData.get("type"),
        category: formData.get("category"),
        amount: formData.get("amount"),
        description: formData.get("description"),
        data: new Date().toISOString()
    };

    try {
        const response = await fetch("/entries", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entryData)
        });

        if (response.ok) {
            const result = await response.json();
            displayEntry(result);

            // 再度エントリをフェッチして合計を更新
            const entriesResponse = await fetch("/entries");
            const entries = await entriesResponse.json();
            updateTotalAmount(entries);
            drawCategoryChart(entries);
        } else {
            console.error("Error adding entry:", await response.text());
        }
    } catch (error) {
        console.error("Error adding entry:", error);
    }
    location.reload();
});

async function fetchEntries() {
    try {
        const response = await fetch("/entries");
        const entries = await response.json();

        entries.forEach(displayEntry);
        updateTotalAmount(entries);
        drawCategoryChart(entries);
    } catch (error) {
        console.error("Error fetching entries:", error);
    }
}

function updateTotalAmount(entries) {
    let total = 0;
    entries.forEach(entry => {
        if (entry.type === "income") {
            total += entry.amount;
        } else if (entry.type === "expense") {
            total -= entry.amount;
        }
    });
    document.getElementById("totalAmount").textContent = total;
}

function displayEntry(entry) {
    const list = document.getElementById("entriesList");
    const card = document.createElement("div");
    card.className = "entry-card bg-white rounded-lg shadow-md p-4";

    // カードヘッダー（日付と金額）
    const cardHeader = document.createElement("div");
    cardHeader.className = "entry-header flex justify-between items-center mb-2";

    const entryDate = document.createElement("span");
    entryDate.className = "entry-date text-sm text-gray-500";
    entryDate.textContent = new Date(entry.date).toLocaleDateString();

    const entryAmount = document.createElement("span");
    entryAmount.className = entry.type === 'income' ? 'text-green-500 font-bold' : 'text-red-500 font-bold';
    entryAmount.textContent = `${entry.amount}円`;

    cardHeader.appendChild(entryDate);
    cardHeader.appendChild(entryAmount);
    card.appendChild(cardHeader);

    // カード内容（カテゴリと説明）
    const cardContent = document.createElement("div");
    cardContent.className = "entry-content";

    const entryCategory = document.createElement("span");
    entryCategory.className = "entry-category text-indigo-600";
    entryCategory.textContent = entry.category;

    const entryDescription = document.createElement("p");
    entryDescription.className = "entry-description mt-2";
    entryDescription.textContent = entry.description;

    cardContent.appendChild(entryCategory);
    cardContent.appendChild(entryDescription);
    card.appendChild(cardContent);

    // 編集ボタン
    const editButton = document.createElement("button");
    editButton.textContent = "編集";
    editButton.className = "mt-3 mr-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600";
    editButton.onclick = function () {
        editEntry(entry._id);
    };
    card.appendChild(editButton);

    // 削除ボタン
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.className = "mt-3 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600";
    deleteButton.onclick = function () {
        deleteEntry(entry._id);
    };
    card.appendChild(deleteButton);

    list.appendChild(card);
}

async function editEntry(id) {
    const newAmount = prompt("新しい金額を入力してください:");
    if (newAmount) {
        try {
            const response = await fetch(`/entries/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ amount: newAmount })
            });
            location.reload(); // ページをリロードして変更を表示
        } catch (error) {
            console.error("Error editing entry:", error);
        }
    }
}

async function deleteEntry(id) {
    if (confirm("本当にこのエントリを削除しますか？")) {
        try {
            await fetch(`/entries/${id}`, { method: "DELETE" });
            location.reload();
        } catch (error) {
            console.error("Error deleting entry:", error);
        }
    }
}

function drawCategoryChart(entries) {
    const incomeCategories = {};
    const expenseCategories = {};

    entries.forEach(entry => {
        if (entry.type === "income") {
            if (incomeCategories[entry.category]) {
                incomeCategories[entry.category] += entry.amount;
            } else {
                incomeCategories[entry.category] = entry.amount;
            }
        } else {
            if (expenseCategories[entry.category]) {
                expenseCategories[entry.category] += entry.amount;
            } else {
                expenseCategories[entry.category] = entry.amount;
            }
        }
    });

    const drawChart = (elementId, data) => {
        const ctx = document.getElementById(elementId).getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BCOCO', '#FF9F40'],
                }]
            }
        });
    };

    drawChart('incomeCategoryChart', incomeCategories);
    drawChart('expenseCategoryChart', expenseCategories);
}

// Fetch entries on page load
fetchEntries();
