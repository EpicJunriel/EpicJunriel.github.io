// サブスクデータをLocalStorageから取得して表示
function loadSubscriptions() {
    const container = document.getElementById('subscriptions');
    container.innerHTML = '';

    for (const key of Object.keys(localStorage)) {
        const sub = JSON.parse(localStorage.getItem(key));
        displaySubscription(sub);
    }
}

// サブスクデータを追加
function addSubscription() {
    const serviceName = document.getElementById('serviceName').value;
    const monthlyCost = parseFloat(document.getElementById('monthlyCost').value);
    const paymentDay = parseInt(document.getElementById('paymentDay').value);

    if (!serviceName || isNaN(monthlyCost) || isNaN(paymentDay) || paymentDay < 1 || paymentDay > 31) {
        alert('入力が正しくありません');
        return;
    }

    const subscription = {
        serviceName,
        monthlyCost,
        paymentDay
    };

    localStorage.setItem(serviceName, JSON.stringify(subscription));
    displaySubscription(subscription);
}

// サブスクデータを表示
function displaySubscription(sub) {
    const container = document.getElementById('subscriptions');
    const subElement = document.createElement('div');
    subElement.classList.add('subscription');
    subElement.id = sub.serviceName;

    container.appendChild(subElement);
    updateCostDisplay(sub);
}

// コストをリアルタイムで更新
function updateCostDisplay(sub) {
    const subElement = document.getElementById(sub.serviceName);
    const now = new Date();
    const monthlyCost = sub.monthlyCost;
    const paymentDay = sub.paymentDay;
    const dailyCost = monthlyCost / 30;

    // 支払日を計算
    let paymentDate = new Date(now.getFullYear(), now.getMonth(), paymentDay, 0, 0, 0, 0);
    if (paymentDate > now) {
        paymentDate.setMonth(now.getMonth() - 1);
    }

    function update() {
        const now = new Date();
        const elapsedMilliseconds = now - paymentDate;
        const elapsedDays = elapsedMilliseconds / (1000 * 60 * 60 * 24);
        const currentCost = (dailyCost * elapsedDays).toFixed(2);

        subElement.innerHTML = `
            <h3>${sub.serviceName}</h3>
            <p>月額費用: ¥${monthlyCost}</p>
            <p>支払日: 毎月 ${paymentDay} 日</p>
            <p class="cost">現在のコスト: ¥${currentCost}</p>
            <button onclick="removeSubscription('${sub.serviceName}')">削除</button>
        `;

        // 次のフレームで更新
        requestAnimationFrame(update);
    }

    update();
}

// サブスクデータを削除
function removeSubscription(serviceName) {
    localStorage.removeItem(serviceName);
    document.getElementById(serviceName).remove();
}

// ページ読み込み時にサブスクデータを表示
loadSubscriptions();
