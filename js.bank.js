document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (localStorage.getItem('darkbank_logged_in') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // ========== ESTADO DA APLICAÇÃO ==========
    let saldo = 12569.42;
    let limiteCartao = 4750.00;
    let currentSection = 'inicio';
    let notifications = [
        { id: 1, title: "Bem-vindo ao DarkBank", message: "Seu login foi realizado com sucesso", read: false },
        { id: 2, title: "Atualização disponível", message: "Nova versão do app na loja", read: false },
        { id: 3, title: "Oferta especial", message: "Limite do cartão aumentado para R$ 8.000,00", read: false }
    ];

    // ========== ELEMENTOS DO DOM ==========
    // Botões principais
    const transferBtn = document.querySelector('.transfer-btn');
    const depositBtn = document.querySelector('.deposit-btn');
    const payBtn = document.querySelector('.pay-btn');
    const rechargeBtn = document.querySelector('.recharge-btn');
    const investBtn = document.querySelector('.btn-invest');
    const loanBtn = document.querySelector('.btn-loan');
    const supportBtn = document.querySelector('.btn-support');
    const notificationBtn = document.querySelector('.btn-notification');
    const filterBtn = document.querySelector('.btn-filter');
    const showMoreBtn = document.querySelector('.btn-show-more');
    const logoutBtn = document.querySelector('.btn-logout');

    // Modais
    const modals = {
        transfer: document.getElementById('transferModal'),
        deposit: document.getElementById('depositModal'),
        payment: document.getElementById('paymentModal'),
        recharge: document.getElementById('rechargeModal'),
        loan: document.getElementById('loanModal'),
        support: document.getElementById('supportModal'),
        filter: document.getElementById('filterModal')
    };

    // Formulários
    const forms = {
        transfer: document.getElementById('transferForm'),
        deposit: document.getElementById('depositForm'),
        payment: document.getElementById('paymentForm'),
        recharge: document.getElementById('rechargeForm'),
        loan: document.getElementById('loanForm'),
        support: document.getElementById('supportForm'),
        filter: document.getElementById('filterForm')
    };

    // Seções
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.main-nav li');
    const shortcutItems = document.querySelectorAll('.shortcut-item');
    const transactionsList = document.querySelector('.transactions-list');

    // ========== FUNÇÕES AUXILIARES ==========
    function formatMoney(value) {
        return value.toLocaleString('pt-BR', { 
            style: 'currency', 
            currency: 'BRL',
            minimumFractionDigits: 2
        });
    }

    function updateUI() {
        // Atualizar saldo
        document.querySelector('.balance-amount').textContent = formatMoney(saldo);
        
        // Atualizar limite do cartão
        document.querySelector('.card-limit').textContent = `Limite disponível: ${formatMoney(limiteCartao)}`;
        
        // Atualizar notificações
        const unreadCount = notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    function showSection(sectionId) {
        // Esconder todas as seções
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        // Mostrar seção atual
        const activeSection = document.getElementById(`${sectionId}-section`);
        if (activeSection) {
            activeSection.style.display = 'block';
            currentSection = sectionId;
        }
        
        // Atualizar menu ativo
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });
    }

    function showModal(modalId) {
        if (modals[modalId]) {
            modals[modalId].style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAllModals() {
        Object.values(modals).forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }

    function addTransaction(name, amount, type, description = '') {
        const now = new Date();
        const timeString = now.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        transactionItem.innerHTML = `
            <div class="transaction-icon">
                <i class="fas fa-${type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <h3>${name}</h3>
                <span>Hoje, ${timeString}</span>
                ${description ? `<p class="transaction-description">${description}</p>` : ''}
            </div>
            <div class="transaction-amount ${type}">
                ${type === 'income' ? '+' : '-'} ${formatMoney(amount)}
            </div>
        `;
        
        transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    }

    function showNotifications() {
        // Criar popup de notificações
        const notificationPopup = document.createElement('div');
        notificationPopup.className = 'notification-popup';
        
        // Criar conteúdo
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationPopup.innerHTML = `
            <div class="notification-header">
                <h3>Notificações (${unreadCount})</h3>
                <button class="close-notifications">&times;</button>
            </div>
            <div class="notification-content">
                ${notifications.map(n => `
                    <div class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <span class="notification-time">Agora há pouco</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Adicionar ao body
        document.body.appendChild(notificationPopup);
        
        // Fechar ao clicar no botão
        notificationPopup.querySelector('.close-notifications').addEventListener('click', () => {
            notificationPopup.remove();
        });
        
        // Marcar como lida ao clicar
        notificationPopup.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                notifications = notifications.map(n => 
                    n.id === id ? {...n, read: true} : n
                );
                updateUI();
                this.classList.replace('unread', 'read');
            });
        });
    }

    // ========== MÁSCARAS DE INPUT ==========
    function applyInputMasks() {
        // Máscara para CPF
        const cpfInputs = document.querySelectorAll('input[type="text"][id*="cpf"]');
        cpfInputs.forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length > 3) value = value.replace(/^(\d{3})(\d)/, '$1.$2');
                if (value.length > 6) value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
                if (value.length > 9) value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
                if (value.length > 11) value = value.substring(0, 14);
                this.value = value;
            });
        });

        // Máscara para telefone
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                if (value.length > 0) value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                if (value.length > 10) value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                this.value = value.substring(0, 15);
            });
        });

        // Máscara para valores monetários
        const moneyInputs = document.querySelectorAll('input[type="text"][id*="Value"]');
        moneyInputs.forEach(input => {
            input.addEventListener('input', function() {
                let value = this.value.replace(/\D/g, '');
                value = (value / 100).toFixed(2);
                value = value.replace('.', ',');
                value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
                this.value = 'R$ ' + value;
            });
        });
    }

    // ========== EVENT LISTENERS ==========
    // Navegação principal
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.dataset.section);
        });
    });

    // Atalhos
    shortcutItems.forEach(item => {
        item.addEventListener('click', function() {
            const action = this.dataset.action;
            switch(action) {
                case 'seguros':
                    showSection('investimentos');
                    break;
                case 'indique-amigos':
                    alert('Indique amigos e ganhe R$50 para cada amigo que se tornar cliente!\nSeu código: DARK123');
                    break;
                case 'compras':
                    showModal('payment');
                    break;
                case 'guardar-dinheiro':
                    showSection('investimentos');
                    break;
                case 'alimentacao':
                    alert('Mostrando estabelecimentos de alimentação próximos...');
                    break;
                case 'ver-todos':
                    showSection('inicio');
                    break;
            }
        });
    });

    // Botões principais
    transferBtn.addEventListener('click', () => showModal('transfer'));
    depositBtn.addEventListener('click', () => showModal('deposit'));
    payBtn.addEventListener('click', () => showModal('payment'));
    rechargeBtn.addEventListener('click', () => showModal('recharge'));
    investBtn.addEventListener('click', () => showSection('investimentos'));
    loanBtn.addEventListener('click', () => showModal('loan'));
    supportBtn.addEventListener('click', () => showModal('support'));
    notificationBtn.addEventListener('click', showNotifications);
    filterBtn.addEventListener('click', () => showModal('filter'));
    showMoreBtn.addEventListener('click', loadMoreTransactions);
    logoutBtn.addEventListener('click', logout);

    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    // ========== FORMULÁRIOS ==========
    // Transferência
    forms.transfer.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = parseFloat(
            this.querySelector('#transferValue').value
                .replace('R$ ', '')
                .replace('.', '')
                .replace(',', '.')
        );
        const to = this.querySelector('#transferTo').value;
        const description = this.querySelector('#transferDescription').value;

        if (!value || !to) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        if (value > saldo) {
            alert('Saldo insuficiente para esta transferência!');
            return;
        }

        saldo -= value;
        addTransaction(`Transferência para ${to}`, value, 'outcome', description);
        alert(`Transferência de ${formatMoney(value)} realizada com sucesso!`);
        closeAllModals();
        this.reset();
        updateUI();
    });

    // Depósito
    forms.deposit.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = parseFloat(
            this.querySelector('#depositValue').value
                .replace('R$ ', '')
                .replace('.', '')
                .replace(',', '.')
        );
        const type = this.querySelector('input[name="depositType"]:checked').value;

        if (!value) {
            alert('Informe o valor do depósito!');
            return;
        }

        saldo += value;
        addTransaction(`Depósito via ${type}`, value, 'income');
        alert(`Depósito de ${formatMoney(value)} realizado com sucesso!`);
        closeAllModals();
        this.reset();
        updateUI();
    });

    // Pagamento
    forms.payment.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = parseFloat(
            this.querySelector('#paymentValue').value
                .replace('R$ ', '')
                .replace('.', '')
                .replace(',', '.')
        );
        const type = this.querySelector('#paymentType').value;
        const code = this.querySelector('#paymentCode').value;

        if (!value || !code) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        if (value > saldo) {
            alert('Saldo insuficiente para este pagamento!');
            return;
        }

        saldo -= value;
        addTransaction(`Pagamento ${type}`, value, 'outcome', `Código: ${code}`);
        alert(`Pagamento de ${formatMoney(value)} realizado com sucesso!`);
        closeAllModals();
        this.reset();
        updateUI();
    });

    // Recarga
    forms.recharge.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = parseFloat(
            this.querySelector('#rechargeValue').value
                .replace('R$ ', '')
                .replace('.', '')
                .replace(',', '.')
        );
        const phone = this.querySelector('#rechargePhone').value;
        const operator = this.querySelector('#rechargeOperator').value;

        if (!value || !phone) {
            alert('Preencha todos os campos obrigatórios!');
            return;
        }

        if (value > saldo) {
            alert('Saldo insuficiente para esta recarga!');
            return;
        }

        saldo -= value;
        addTransaction(`Recarga ${operator}`, value, 'outcome', `Número: ${phone}`);
        alert(`Recarga de ${formatMoney(value)} realizada com sucesso para ${phone}!`);
        closeAllModals();
        this.reset();
        updateUI();
    });

    // Empréstimo
    forms.loan.addEventListener('submit', function(e) {
        e.preventDefault();
        const value = parseFloat(
            this.querySelector('#loanValue').value
                .replace('R$ ', '')
                .replace('.', '')
                .replace(',', '.')
        );
        const installments = this.querySelector('#loanInstallments').value;
        const purpose = this.querySelector('input[name="loanPurpose"]:checked').value;

        if (!value) {
            alert('Informe o valor desejado!');
            return;
        }

        const total = (value * Math.pow(1.025, installments)).toFixed(2);
        alert(`Simulação de empréstimo ${purpose}:\n\n` +
              `Valor: ${formatMoney(value)}\n` +
              `Parcelas: ${installments}x\n` +
              `Taxa: 2,5% a.m.\n` +
              `Total: ${formatMoney(total)}`);
        
        closeAllModals();
        this.reset();
    });

    // Suporte
    forms.support.addEventListener('submit', function(e) {
        e.preventDefault();
        const subject = this.querySelector('#supportSubject').value;
        const message = this.querySelector('#supportMessage').value;

        if (!message) {
            alert('Descreva seu problema!');
            return;
        }

        alert(`Mensagem enviada com sucesso!\nAssunto: ${subject}\n\nEm breve entraremos em contato.`);
        closeAllModals();
        this.reset();
    });

    // Filtro
    forms.filter.addEventListener('submit', function(e) {
        e.preventDefault();
        const period = this.querySelector('#filterPeriod').value;
        const type = this.querySelector('#filterType').value;
        const category = this.querySelector('#filterCategory').value;

        alert(`Filtros aplicados:\n` +
              `Período: últimos ${period} dias\n` +
              `Tipo: ${type}\n` +
              `Categoria: ${category}`);
        
        closeAllModals();
    });

    // ========== FUNÇÕES ADICIONAIS ==========
    function loadMoreTransactions() {
        const moreTransactions = [
            { name: "Netflix", amount: 39.90, type: "outcome", desc: "Assinatura mensal" },
            { name: "Salário", amount: 5200.00, type: "income", desc: "Empresa XYZ" },
            { name: "Supermercado", amount: 327.45, type: "outcome", desc: "Mercado Central" }
        ];

        moreTransactions.forEach(t => {
            addTransaction(t.name, t.amount, t.type, t.desc);
        });

        showMoreBtn.textContent = "Não há mais transações";
        showMoreBtn.disabled = true;
    }

    function logout() {
        localStorage.removeItem('darkbank_logged_in');
        window.location.href = 'login.html';
    }

    // ========== INICIALIZAÇÃO ==========
    function init() {
        applyInputMasks();
        updateUI();
        showSection('inicio');

        // Adicionar transações iniciais
        const initialTransactions = [
            { name: "Amazon", amount: 129.90, type: "outcome", desc: "Compra online" },
            { name: "Transferência recebida", amount: 500.00, type: "income", desc: "João Silva" },
            { name: "Restaurante", amount: 87.50, type: "outcome", desc: "Jantar" }
        ];

        initialTransactions.forEach(t => {
            addTransaction(t.name, t.amount, t.type, t.desc);
        });
    }

    init();
});