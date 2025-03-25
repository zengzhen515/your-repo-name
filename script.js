document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const elements = {
        amountInput: document.getElementById('amount-input'),
        highCardBtn: document.getElementById('high-card'),
        lowCardBtn: document.getElementById('low-card'),
        highCardValue: document.getElementById('high-card-value'),
        lowCardValue: document.getElementById('low-card-value'),
        ureaInput: document.getElementById('urea-input'),
        ureaMinusBtn: document.getElementById('urea-minus'),
        ureaPlusBtn: document.getElementById('urea-plus'),
        attendantBtn: document.getElementById('attendant-btn'),
        finalResult: document.getElementById('final-result'),
        discountPrice: document.getElementById('discount-price'),
        fuelLiter: document.getElementById('fuel-liter'),
        confirmBtn: document.getElementById('confirm-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        recordsBtn: document.getElementById('records-btn'),
        recordsModal: document.getElementById('records-modal'),
        recordsList: document.getElementById('records-list'),
        closeBtn: document.querySelector('.close-btn'),
        wechatPayBtn: document.getElementById('wechat-pay'),
        creditCardBtn: document.getElementById('credit-card'),
        groupChatBtn: document.getElementById('group-chat')
    };

    // 状态管理
    const state = {
        selectedCard: 'high',
        isAttendantActive: false,
        currentAmount: 0,
        currentUrea: 0,
        touchStartX: 0,
        touchStartY: 0
    };

    // 初始化设置
    function initSettings() {
        // 从localStorage加载或使用默认值
        const highValue = localStorage.getItem('highCardValue');
        const lowValue = localStorage.getItem('lowCardValue');
        
        if (highValue) elements.highCardValue.textContent = highValue;
        if (lowValue) elements.lowCardValue.textContent = lowValue;
        
        updateDiscountDisplay();
    }

    // 更新优惠价显示
    function updateDiscountDisplay() {
        const baseDiscount = parseFloat(localStorage.getItem('discountPrice')) || 0.50;
        const attendantValue = state.isAttendantActive ? (parseFloat(localStorage.getItem('attendantValue')) || 0.20) : 0;
        elements.discountPrice.textContent = (baseDiscount + attendantValue).toFixed(2);
    }

    // 核心计算函数
    function calculate() {
        // 解析金额输入
        let amount = 0;
        const inputValue = elements.amountInput.value.trim();
        
        if (inputValue.includes('+')) {
            amount = inputValue.split('+')
                .map(num => parseFloat(num.trim()) || 0)
                .reduce((sum, num) => sum + num, 0);
        } else {
            amount = parseFloat(inputValue) || 0;
        }
        
        state.currentAmount = amount;

        // 获取当前卡值
        const cardValue = parseFloat(
            state.selectedCard === 'high' 
                ? elements.highCardValue.textContent 
                : elements.lowCardValue.textContent
        );

        // 获取优惠参数
        const baseDiscount = parseFloat(localStorage.getItem('discountPrice')) || 0.50;
        const attendantValue = state.isAttendantActive 
            ? (parseFloat(localStorage.getItem('attendantValue')) || 0.20) 
            : 0;
        
        // 获取尿素参数
        const ureaCount = parseInt(elements.ureaInput.value) || 0;
        state.currentUrea = ureaCount;
        const ureaPrice = parseFloat(localStorage.getItem('ureaPrice')) || 10.00;

        // 计算
        const liters = amount / cardValue;
        const discountTotal = liters * (baseDiscount + attendantValue);
        const ureaTotal = ureaCount * ureaPrice;
        const total = discountTotal + ureaTotal;

        // 更新显示
        elements.fuelLiter.textContent = liters.toFixed(2);
        elements.finalResult.textContent = total.toFixed(2);
    }

    // 保存记录
    function saveRecord() {
        if (!state.currentAmount || state.currentAmount <= 0) {
            alert('请输入有效的金额！');
            return;
        }

        const record = {
            date: new Date().toLocaleString(),
            amount: state.currentAmount.toFixed(2),
            cardType: state.selectedCard === 'high' ? '高价卡' : '低价卡',
            cardValue: state.selectedCard === 'high' 
                ? elements.highCardValue.textContent 
                : elements.lowCardValue.textContent,
            liters: elements.fuelLiter.textContent,
            discount: elements.discountPrice.textContent,
            attendant: state.isAttendantActive ? '是' : '否',
            urea: state.currentUrea,
            total: elements.finalResult.textContent,
            timestamp: Date.now()
        };

        // 保存记录
        let records = JSON.parse(localStorage.getItem('records')) || [];
        records.push(record);
        localStorage.setItem('records', JSON.stringify(records));

        // 重置界面
        elements.amountInput.value = '';
        elements.ureaInput.value = '0';
        state.currentAmount = 0;
        state.currentUrea = 0;
        calculate();
        
        alert('记录已保存！');
    }

    // 加载记录
    function loadRecords() {
        cleanOldRecords();
        elements.recordsList.innerHTML = '';
        
        const records = JSON.parse(localStorage.getItem('records')) || [];
        if (records.length === 0) {
            elements.recordsList.innerHTML = '<li style="padding: 20px; text-align: center;">暂无记录</li>';
            return;
        }

        // 按时间倒序显示
        records.reverse().forEach((record, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="record-header">
                    <span class="record-date">${record.date}</span>
                    <button class="delete-btn" data-index="${index}">删除</button>
                </div>
                <div class="record-detail">
                    <span>金额: ${record.amount}元</span>
                    <span>卡类型: ${record.cardType}</span>
                </div>
                <div class="record-detail">
                    <span>升数: ${record.liters}升</span>
                    <span>优惠价: ${record.discount}元</span>
                </div>
                <div class="record-detail">
                    <span>尿素: ${record.urea}</span>
                    <span>加油员: ${record.attendant}</span>
                </div>
                <div class="record-total">总计: ${record.total}元</div>
            `;
            elements.recordsList.appendChild(li);
        });

        // 添加删除事件
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('确定要删除这条记录吗？')) {
                    deleteRecord(parseInt(this.getAttribute('data-index')));
                }
            });
        });
    }

    // 删除记录
    function deleteRecord(index) {
        let records = JSON.parse(localStorage.getItem('records')) || [];
        records.reverse();
        records.splice(index, 1);
        records.reverse();
        localStorage.setItem('records', JSON.stringify(records));
        loadRecords();
    }

    // 清理过期记录(3天)
    function cleanOldRecords() {
        const now = Date.now();
        let records = JSON.parse(localStorage.getItem('records')) || [];
        
        records = records.filter(record => now - record.timestamp <= 3 * 24 * 60 * 60 * 1000);
        localStorage.setItem('records', JSON.stringify(records));
    }

    // 显示图片
    function showImage(type) {
        const imageUrl = localStorage.getItem(`${type}Image`);
        if (imageUrl) {
            const win = window.open('', '_blank');
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${type}</title>
                    <style>
                        body { margin: 0; padding: 0; display: flex; 
                               justify-content: center; align-items: center; 
                               height: 100vh; background: #000; }
                        img { max-width: 100%; max-height: 100%; }
                    </style>
                </head>
                <body onclick="window.close()">
                    <img src="${imageUrl}">
                </body>
                </html>
            `);
        } else {
            alert('请先在设置中上传图片');
        }
    }

    // 初始化事件监听
    function initEventListeners() {
        // 输入事件
        elements.amountInput.addEventListener('input', calculate);
        elements.ureaInput.addEventListener('input', function() {
            state.currentUrea = parseInt(this.value) || 0;
            calculate();
        });

        // 卡片选择
        elements.highCardBtn.addEventListener('click', function() {
            state.selectedCard = 'high';
            elements.highCardBtn.classList.add('active');
            elements.lowCardBtn.classList.remove('active');
            calculate();
        });

        elements.lowCardBtn.addEventListener('click', function() {
            state.selectedCard = 'low';
            elements.lowCardBtn.classList.add('active');
            elements.highCardBtn.classList.remove('active');
            calculate();
        });

        // 加油员开关
        elements.attendantBtn.addEventListener('click', function() {
            state.isAttendantActive = !state.isAttendantActive;
            elements.attendantBtn.classList.toggle('active');
            updateDiscountDisplay();
            calculate();
        });

        // 尿素数量
        elements.ureaMinusBtn.addEventListener('click', function() {
            elements.ureaInput.value = Math.max(0, parseInt(elements.ureaInput.value) - 1);
            state.currentUrea = parseInt(elements.ureaInput.value);
            calculate();
        });

        elements.ureaPlusBtn.addEventListener('click', function() {
            elements.ureaInput.value = parseInt(elements.ureaInput.value) + 1;
            state.currentUrea = parseInt(elements.ureaInput.value);
            calculate();
        });

        // 主要功能按钮
        elements.confirmBtn.addEventListener('click', saveRecord);
        elements.settingsBtn.addEventListener('click', function() {
            window.location.href = 'settings.html';
        });

        elements.recordsBtn.addEventListener('click', function() {
            loadRecords();
            elements.recordsModal.style.display = 'flex';
        });

        elements.closeBtn.addEventListener('click', function() {
            elements.recordsModal.style.display = 'none';
        });

        // 图片按钮
        elements.wechatPayBtn.addEventListener('click', () => showImage('wechatPay'));
        elements.creditCardBtn.addEventListener('click', () => showImage('creditCard'));
        elements.groupChatBtn.addEventListener('click', () => showImage('groupChat'));

        // 触摸事件处理
        document.addEventListener('touchstart', function(e) {
            state.touchStartX = e.touches[0].clientX;
            state.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        // 防止模态框外滑动导致页面滚动
        elements.recordsModal.addEventListener('touchmove', function(e) {
            if (this.scrollHeight > this.clientHeight) {
                e.stopPropagation();
            }
        }, { passive: false });
    }

    // 初始化应用
    function initApp() {
        initSettings();
        initEventListeners();
        calculate();
    }

    // 启动应用
    initApp();
});