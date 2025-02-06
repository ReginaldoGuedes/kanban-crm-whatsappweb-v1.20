// ==UserScript==
// @name	CRM para WhatsApp Web
// @namespace    http://tampermonkey.net/
// @version      1.20
// @description  Organize contatos em um CRM estilo Kanban no WhatsApp Web com registro de vendas (ID, Cliente, Produto, Nº Pedido, Observações), cálculo de faturamento e pesquisa por período!
// @author	Reginaldo Guedes (modificado por Qwen)
// @match	https://web.whatsapp.com/*
// @grant	GM_setValue
// @grant	GM_getValue
// ==/UserScript==
(function() {
    'use strict';

    // Função para aplicar o fundo apenas no painel CRM
    function applyBackground() {
        let crmBoard = document.getElementById('crmBoard');
        if (crmBoard) {
            crmBoard.style.backgroundColor = '#213343';  // Cor de fundo do painel CRM
        }
    }

    // Função para criar o botão de alternância do CRM
    function createToggleButton() {
        let toggleButton = document.createElement('button');
        toggleButton.innerText = 'ZAP CRM';
        toggleButton.id = 'crmToggleButton';
        toggleButton.style.position = 'fixed';
        toggleButton.style.top = '10px';
        toggleButton.style.right = '10px';
        toggleButton.style.padding = '10px';
        toggleButton.style.background = '#007bff';
        toggleButton.style.color = '#fff';
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '5px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.zIndex = '1000';
        toggleButton.style.width = 'auto';  // Largura fixa
        toggleButton.style.height = 'auto'; // Altura fixa
        // Oculta o botão ZAP CRM
        toggleButton.style.display = 'none'; // O botão será sempre oculto
        // Permitindo mover o botão com o mouse (opcional, caso queira reativar futuramente)
        let isDragging = false;
        let offsetX, offsetY;
        toggleButton.onmousedown = (e) => {
            isDragging = true;
            offsetX = e.clientX - toggleButton.getBoundingClientRect().left;
            offsetY = e.clientY - toggleButton.getBoundingClientRect().top;
            toggleButton.style.transition = 'none'; // Desabilita transição ao arrastar
        };
        document.onmousemove = (e) => {
            if (isDragging) {
                toggleButton.style.left = `${e.clientX - offsetX}px`;
                toggleButton.style.top = `${e.clientY - offsetY}px`;
            }
        };
        document.onmouseup = () => {
            isDragging = false;
            toggleButton.style.transition = 'top 0.2s, left 0.2s'; // Reativa transição
        };
        toggleButton.onclick = toggleCRMBoard;
        document.body.appendChild(toggleButton);
        // Adicionando atalho ESC para alternar a visibilidade do painel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { // Detecta a tecla ESC
                toggleCRMAndButton(); // Alterna a visibilidade do painel e do botão
            }
        });
    }

    // Função para alternar a visibilidade do painel CRM e do botão ZAP CRM
    function toggleCRMAndButton() {
        let board = document.getElementById('crmBoard');
        let toggleButton = document.getElementById('crmToggleButton');
        if (board.style.display === 'none' || board.style.display === '') {
            // Exibe o painel CRM e o botão ZAP CRM
            board.style.display = 'flex';
            toggleButton.style.display = 'block';
            applyBackground(); // Aplica o fundo no painel CRM ao exibir
        } else {
            // Oculta o painel CRM e o botão ZAP CRM
            board.style.display = 'none';
            toggleButton.style.display = 'none';
        }
    }

    // Função para alternar a exibição do painel CRM (mantida para compatibilidade)
    function toggleCRMBoard() {
        let board = document.getElementById('crmBoard');
        board.style.display = (board.style.display === 'none') ? 'flex' : 'none';
        applyBackground(); // Aplica o fundo no painel CRM ao alternar
    }

    // Função para criar o painel do CRM
    function createCRMBoard() {
        if (document.getElementById('crmBoard')) return;
        let board = document.createElement('div');
        board.id = 'crmBoard';
        board.style.position = 'fixed';
        board.style.top = '0';
        board.style.left = '0';
        board.style.width = '98vw';  // O painel vai ocupar toda a largura da tela
        board.style.height = '96vh';  // O painel vai ocupar toda a altura da tela
        board.style.background = '#f5f5f5';  // Cor de fundo padrão do painel CRM
        board.style.display = 'none';
        board.style.flexDirection = 'column';
        board.style.overflowX = 'auto';
        board.style.padding = '10px';
        board.style.gap = '10px';
        board.style.zIndex = '999';
        board.style.border = '1px solid #ccc';
        board.style.borderRadius = '8px';
        board.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
        // Dividir o painel em duas partes: Kanban e Registro de Vendas
        let kanbanSection = document.createElement('div');
        kanbanSection.style.flex = '1';
        kanbanSection.style.display = 'flex';
        kanbanSection.style.flexDirection = 'column';
        kanbanSection.style.overflowY = 'auto';
        let salesSection = document.createElement('div');
        salesSection.style.height = '250px'; // Diminuído a altura para dar mais espaço ao Kanban
        salesSection.style.borderTop = '1px solid #ccc';
        salesSection.style.paddingTop = '10px';
        salesSection.style.display = 'flex';
        salesSection.style.flexDirection = 'column';
        salesSection.style.gap = '10px';
        // Criação dos botões no cabeçalho
        let header = document.createElement('div');
        header.style.padding = '10px';
        header.style.display = 'flex';
        header.style.alignItems = 'center';  // Alinha o input e o botão verticalmente
        header.style.gap = '10px';  // Espaço entre o input e o botão
        let buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
        let budgetButton = createHeaderButton('Orçamento', '#ffc107');
        let freightButton = createHeaderButton('Frete', '#28a745');
        let invoiceButton = createHeaderButton('Emitir NFs', '#007bff');
        let receiptButton = createHeaderButton('Emitir Recibo', '#6c757d');
        // Adicionando o botão "Config."
        let configButton = document.createElement('button');
        configButton.innerText = 'Config.';
        configButton.style.padding = '8px';
        configButton.style.border = 'none';
        configButton.style.borderRadius = '5px';
        configButton.style.background = '#17a2b8';
        configButton.style.color = '#fff';
        configButton.style.cursor = 'pointer';
        configButton.onclick = showConfigPopup;
        buttonsContainer.appendChild(budgetButton);
        buttonsContainer.appendChild(freightButton);
        buttonsContainer.appendChild(invoiceButton);
        buttonsContainer.appendChild(receiptButton);
        buttonsContainer.appendChild(configButton);
        // Adicionando input para nome
        let inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.placeholder = 'Nome'; // Placeholder pequeno
        inputName.style.padding = '8px';
        inputName.style.border = '1px solid #ccc';
        inputName.style.borderRadius = '5px';
        inputName.style.flex = '1';  // Faz o input ocupar o espaço restante
        inputName.style.fontSize = '14px'; // Ajustando o tamanho da fonte do input
        // Adiciona a função para adicionar ao pressionar "Enter"
        inputName.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && inputName.value.trim() !== '') {
                let contact = createDraggableContact(inputName.value.trim());
                containers['Negociação'].appendChild(contact);
                saveContacts();
                inputName.value = '';
            }
        });
        header.appendChild(buttonsContainer);
        header.appendChild(inputName);
        kanbanSection.appendChild(header);
        // Definindo as etapas do Kanban
        let stages = [
            { name: 'Negociação', color: '#ff9800' },
            { name: 'Criando', color: '#03a9f4' },
            { name: 'Aprovado', color: '#4caf50' },
            { name: 'Pagamento', color: '#9c27b0' },
            { name: 'Em Produção', color: '#795548' },
            { name: 'Em Transporte', color: '#8bc34a' },
            { name: 'Entregue', color: '#f44336' }
        ];
        let containers = {};
        let columnsContainer = document.createElement('div');
        columnsContainer.style.display = 'flex';
        columnsContainer.style.gap = '10px';
        columnsContainer.style.overflowX = 'auto';
        kanbanSection.appendChild(columnsContainer);
        // Criando as colunas de acordo com as etapas
        stages.forEach(stage => {
            let column = document.createElement('div');
            column.classList.add('crmColumn');
            column.style.flex = '1';
            column.style.minWidth = '150px';
            column.style.background = stage.color;
            column.style.border = '1px solid #ccc';
            column.style.borderRadius = '8px';
            column.style.padding = '10px';
            column.style.display = 'flex';
            column.style.flexDirection = 'column';
            column.style.gap = '5px';
            column.setAttribute('data-stage', stage.name);
            column.ondragover = (e) => e.preventDefault();
            column.ondrop = (e) => {
                let contactId = e.dataTransfer.getData('text');
                let contact = document.getElementById(contactId);
                if (contact) {
                    column.appendChild(contact);
                    saveContacts();
                }
            };
            let title = document.createElement('div');
            title.innerText = stage.name;
            title.style.fontWeight = 'bold';
            title.style.textAlign = 'center';
            title.style.paddingBottom = '5px';
            title.style.borderBottom = '2px solid #fff';
            title.style.color = '#000';
            column.appendChild(title);
            if (stage.name === 'Entregue') {
                let clearButton = document.createElement('button');
                clearButton.innerText = 'Limpar';
                clearButton.style.marginTop = '10px';
                clearButton.style.padding = '8px';
                clearButton.style.border = 'none';
                clearButton.style.borderRadius = '5px';
                clearButton.style.background = '#dc3545';
                clearButton.style.color = '#fff';
                clearButton.style.cursor = 'pointer';
                clearButton.onclick = () => {
                    column.querySelectorAll('.contact').forEach(contact => contact.remove());
                    saveContacts();
                };
                column.appendChild(clearButton);
            }
            columnsContainer.appendChild(column);
            containers[stage.name] = column;
        });
        // Seção de Registro de Vendas
        let clientInput = document.createElement('input');
        clientInput.type = 'text';
        clientInput.placeholder = 'Cliente';
        clientInput.style.padding = '8px';
        clientInput.style.border = '1px solid #ccc';
        clientInput.style.borderRadius = '5px';
        clientInput.style.flex = '1';
        let productInput = document.createElement('input');
        productInput.type = 'text';
        productInput.placeholder = 'Produto';
        productInput.style.padding = '8px';
        productInput.style.border = '1px solid #ccc';
        productInput.style.borderRadius = '5px';
        productInput.style.flex = '1';
        let orderNumberInput = document.createElement('input');
        orderNumberInput.type = 'number';
        orderNumberInput.placeholder = 'Nº Pedido';
        orderNumberInput.style.padding = '8px';
        orderNumberInput.style.border = '1px solid #ccc';
        orderNumberInput.style.borderRadius = '5px';
        orderNumberInput.style.flex = '1';
        let observationsInput = document.createElement('input');
        observationsInput.type = 'text';
        observationsInput.placeholder = 'Observações';
        observationsInput.style.padding = '8px';
        observationsInput.style.border = '1px solid #ccc';
        observationsInput.style.borderRadius = '5px';
        observationsInput.style.flex = '1';
        let salesInput = document.createElement('input');
        salesInput.type = 'number';
        salesInput.placeholder = 'R$'; // Placeholder reduzido
        salesInput.style.padding = '8px';
        salesInput.style.border = '1px solid #ccc';
        salesInput.style.borderRadius = '5px';
        salesInput.style.flex = '1';
        salesInput.style.appearance = 'none'; // Remove as setinhas do campo numérico
        let searchPeriodHeader = document.createElement('div');
        searchPeriodHeader.style.display = 'flex';
        searchPeriodHeader.style.alignItems = 'center';
        searchPeriodHeader.style.gap = '10px';

        // Botão "Relatório"
        let reportButton = document.createElement('button');
        reportButton.innerText = 'Relatório';
        reportButton.style.padding = '8px';
        reportButton.style.border = 'none';
        reportButton.style.borderRadius = '5px';
        reportButton.style.background = '#ffc107'; // Cor amarela para destaque
        reportButton.style.color = '#fff';
        reportButton.style.cursor = 'pointer';
        reportButton.onclick = showReportPopup;

        // Adiciona os campos de registro de vendas ao cabeçalho
        searchPeriodHeader.appendChild(clientInput);
        searchPeriodHeader.appendChild(productInput);
        searchPeriodHeader.appendChild(orderNumberInput);
        searchPeriodHeader.appendChild(observationsInput);
        searchPeriodHeader.appendChild(salesInput);

        // Substitui os campos de data e o botão "Pesquisar" pelo botão "Relatório"
        searchPeriodHeader.appendChild(reportButton);

        let salesList = document.createElement('div');
        salesList.style.flex = '1';
        salesList.style.overflowY = 'auto';
        let totalSalesDisplay = document.createElement('div');
        totalSalesDisplay.style.fontWeight = 'bold';
        totalSalesDisplay.style.textAlign = 'center';
        totalSalesDisplay.style.padding = '10px';
        totalSalesDisplay.style.borderTop = '1px solid #ccc';
        salesSection.appendChild(searchPeriodHeader);
        salesSection.appendChild(salesList);
        salesSection.appendChild(totalSalesDisplay);
        board.appendChild(kanbanSection);
        board.appendChild(salesSection);
        document.body.appendChild(board);

        // Adiciona o estilo CSS para o efeito "swipe-overlay-out"
        const style = document.createElement('style');
        style.innerHTML = `
            .swipe-overlay-out {
                transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            }
            .swipe-overlay-out:hover {
                transform: translateX(-5px);
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);

        // Função auxiliar para criar botões no cabeçalho
        function createHeaderButton(text, backgroundColor) {
            let button = document.createElement('button');
            button.innerText = text;
            button.style.padding = '8px';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.background = backgroundColor;
            button.style.color = '#000';
            button.style.cursor = 'pointer';
            button.style.flex = '0 0 auto'; // Evita que o botão ocupe espaço extra
            button.classList.add('swipe-overlay-out'); // Adiciona o efeito swipe
            let savedLink = GM_getValue(`${text.toLowerCase()}Link`, '');
            button.onclick = () => {
                if (savedLink) {
                    window.open(savedLink, '_blank');
                } else {
                    showPopup(text.toLowerCase(), text); // Abre o popup para configurar o link
                }
            };
            return button;
        }

        function showConfigPopup() {
    // Cria o fundo escuro do popup
    let popupBackground = document.createElement('div');
    popupBackground.style.position = 'fixed';
    popupBackground.style.top = '0';
    popupBackground.style.left = '0';
    popupBackground.style.width = '100vw';
    popupBackground.style.height = '100vh';
    popupBackground.style.background = 'rgba(0, 0, 0, 0.5)';
    popupBackground.style.zIndex = '1001';
    popupBackground.style.display = 'flex';
    popupBackground.style.justifyContent = 'center';
    popupBackground.style.alignItems = 'center';

    // Fecha o popup ao clicar no fundo escuro
    popupBackground.onclick = () => {
        document.body.removeChild(popupBackground);
    };

    // Cria o conteúdo do popup
    let popupContent = document.createElement('div');
    popupContent.style.background = '#008080'; // Cor de fundo teal
    popupContent.style.padding = '20px';
    popupContent.style.borderRadius = '8px';
    popupContent.style.width = '400px';
    popupContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    popupContent.style.textAlign = 'left'; // Alinha o texto à esquerda

    // Evita que o popup seja fechado ao clicar no conteúdo
    popupContent.onclick = (e) => e.stopPropagation();

    // Título do popup
    let popupTitle = document.createElement('h3');
    popupTitle.innerText = 'Configurar Links dos Botões';
    popupTitle.style.marginBottom = '10px';
    popupTitle.style.color = '#fff'; // Texto branco

    // Adiciona o campo para o nome/empresa
let companyRow = document.createElement('div');
companyRow.style.display = 'flex';
companyRow.style.flexDirection = 'column';
companyRow.style.marginBottom = '10px';

let companyLabel = document.createElement('label');
companyLabel.innerText = 'Nome ou Empresa:';
companyLabel.style.color = '#fff'; // Texto branco
companyLabel.style.fontWeight = 'bold';
companyLabel.style.marginBottom = '5px';

let companyInput = document.createElement('input');
companyInput.type = 'text';
companyInput.placeholder = 'Insira seu nome ou o nome da empresa...';
companyInput.style.padding = '8px';
companyInput.style.border = '1px solid #ccc';
companyInput.style.borderRadius = '5px';
companyInput.style.width = '100%';
companyInput.value = GM_getValue('companyName', ''); // Carrega o valor salvo

companyRow.appendChild(companyLabel);
companyRow.appendChild(companyInput);
popupContent.appendChild(companyRow);

// Botão "Salvar"
saveButton.onclick = () => {
    buttonsToConfigure.forEach(buttonText => {
        let key = `${buttonText.toLowerCase()}Link`;
        let value = inputs[buttonText].value.trim();
        GM_setValue(key, value);
    });

    // Salva o nome/empresa
    let companyName = companyInput.value.trim();
    GM_setValue('companyName', companyName);

    alert('Configurações salvas com sucesso!');
    document.body.removeChild(popupBackground);
    location.reload(); // Recarrega a página para aplicar as mudanças
};

    popupContent.appendChild(saveButton);
    popupBackground.appendChild(popupContent);
    document.body.appendChild(popupBackground);
}

        // Função para registrar venda
        let salesData = JSON.parse(GM_getValue('salesData', '[]'));
        function updateTotalSales(filteredSales = salesData) {
            let total = filteredSales.reduce((acc, sale) => acc + sale.amount, 0);
            totalSalesDisplay.innerText = `Total de Vendas: R$ ${total.toFixed(2)}`;
        }
        let clientIdCounter = 1; // Contador para gerar IDs únicos
        // Função para validar os campos
        function validateFields(client, product, orderNumber, observations, amount) {
            if (!client || !product || !orderNumber || !observations || isNaN(amount) || amount <= 0) {
                alert('Todos os campos são obrigatórios e o valor deve ser maior que zero.');
                return false;
            }
            return true;
        }
        // Adicionando funcionalidade ao campo "Cliente"
        clientInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                registerSale();
            }
        });
        // Adicionando funcionalidade ao campo "Valor (R$)"
        salesInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                registerSale();
            }
        });
        // Função para registrar a venda
        function registerSale() {
            let client = clientInput.value.trim();
            let product = productInput.value.trim();
            let orderNumber = orderNumberInput.value.trim();
            let observations = observationsInput.value.trim();
            let amount = parseFloat(salesInput.value);
            // Valida os campos
            if (!validateFields(client, product, orderNumber, observations, amount)) {
                return;
            }
            // Cria um novo registro de venda
            let clientId = `ID: ${clientIdCounter.toString().padStart(3, '0')}`; // Formata o ID como "ID: 001"
            clientIdCounter++;
            let sale = {
                clientId: clientId,
                client: client,
                product: product,
                orderNumber: orderNumber,
                observations: observations,
                amount: amount,
                date: new Date().toISOString()
            };
            // Salva a venda e atualiza a interface
            salesData.push(sale);
            GM_setValue('salesData', JSON.stringify(salesData));
            // Limpa os campos após a inserção
            clientInput.value = '';
            productInput.value = '';
            orderNumberInput.value = '';
            observationsInput.value = '';
            salesInput.value = '';
            // Atualiza a lista de vendas e o total
            updateSalesList();
            updateTotalSales();
        }
        // Função para exibir a lista de vendas
        function updateSalesList(filteredSales = salesData) {
            salesList.innerHTML = '';
            filteredSales.forEach((sale, index) => {
                let saleItem = document.createElement('div');
                saleItem.style.display = 'flex';
                saleItem.style.justifyContent = 'space-between';
                saleItem.style.alignItems = 'center';
                saleItem.style.padding = '5px';
                saleItem.style.borderBottom = '1px solid #ccc';
                let saleText = document.createElement('span');
                saleText.innerText = `${sale.clientId} | ${sale.client} | ${sale.product} | Nº Pedido: ${sale.orderNumber} | Obs: ${sale.observations} | R$ ${sale.amount.toFixed(2)} | ${new Date(sale.date).toLocaleDateString()}`;
                // Botão "Cancelar Venda"
                let cancelButton = document.createElement('button');
                cancelButton.innerText = 'Cancelar Venda';
                cancelButton.style.padding = '5px';
                cancelButton.style.border = 'none';
                cancelButton.style.borderRadius = '5px';
                cancelButton.style.background = '#dc3545';
                cancelButton.style.color = '#fff';
                cancelButton.style.cursor = 'pointer';
                cancelButton.classList.add('swipe-overlay-out'); // Adiciona o efeito swipe
                cancelButton.onclick = () => {
                    // Zera o valor da venda
                    sale.amount = 0;
                    GM_setValue('salesData', JSON.stringify(salesData));
                    updateSalesList();
                    updateTotalSales();
                };
                saleItem.appendChild(saleText);
                saleItem.appendChild(cancelButton);
                salesList.appendChild(saleItem);
            });
        }

 function showReportPopup() {
    // Cria o fundo escuro do popup
    let popupBackground = document.createElement('div');
    popupBackground.style.position = 'fixed';
    popupBackground.style.top = '0';
    popupBackground.style.left = '0';
    popupBackground.style.width = '100vw';
    popupBackground.style.height = '100vh';
    popupBackground.style.background = 'rgba(0, 0, 0, 0.5)';
    popupBackground.style.zIndex = '1001';
    popupBackground.style.display = 'flex';
    popupBackground.style.justifyContent = 'center';
    popupBackground.style.alignItems = 'center';

    // Fecha o popup ao clicar no fundo escuro
    popupBackground.onclick = () => {
        document.body.removeChild(popupBackground);
    };

    // Cria o conteúdo do popup
    let popupContent = document.createElement('div');
    popupContent.style.background = '#fff';
    popupContent.style.padding = '20px';
    popupContent.style.borderRadius = '8px';
    popupContent.style.width = '400px';
    popupContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    popupContent.style.textAlign = 'left';

    // Evita que o popup seja fechado ao clicar no conteúdo
    popupContent.onclick = (e) => e.stopPropagation();

    // Título do popup
    let popupTitle = document.createElement('h3');
    popupTitle.innerText = 'Gerar Relatório';
    popupTitle.style.marginBottom = '10px';

    // Campos de data
    let startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.style.padding = '8px';
    startDateInput.style.border = '1px solid #ccc';
    startDateInput.style.borderRadius = '5px';
    startDateInput.style.marginBottom = '10px';
    startDateInput.style.width = '100%';

    let endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.style.padding = '8px';
    endDateInput.style.border = '1px solid #ccc';
    endDateInput.style.borderRadius = '5px';
    endDateInput.style.marginBottom = '10px';
    endDateInput.style.width = '100%';

    // Botão "Gerar Relatório"
    let generateButton = document.createElement('button');
    generateButton.innerText = 'Gerar Relatório';
    generateButton.style.padding = '8px';
    generateButton.style.border = 'none';
    generateButton.style.borderRadius = '5px';
    generateButton.style.background = '#28a745';
    generateButton.style.color = '#fff';
    generateButton.style.cursor = 'pointer';
    generateButton.style.width = '100%';

    // Função para gerar o relatório
    generateButton.onclick = () => {
        let startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        let endDate = endDateInput.value ? new Date(endDateInput.value) : null;

        if (!startDate || !endDate || startDate > endDate) {
            alert('Por favor, selecione um período válido.');
            return;
        }

        // Ajusta o intervalo de datas para incluir todo o dia
        let startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0); // Define o início do dia

        let endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999); // Define o final do dia

        // Filtra as vendas pelo período selecionado
        let filteredSales = salesData.filter(sale => {
            let saleDate = new Date(sale.date);
            return saleDate >= startOfDay && saleDate <= endOfDay;
        });

        console.log('Vendas filtradas:', filteredSales); // Log para depuração

        // Calcula o total de faturamento
        let total = filteredSales.reduce((acc, sale) => acc + sale.amount, 0);

        // Gera o relatório em HTML
        generateHTMLReport(filteredSales, startOfDay, endOfDay, total);

        // Fecha o popup
        document.body.removeChild(popupBackground);
    };

    // Adiciona os elementos ao popup
    popupContent.appendChild(popupTitle);
    popupContent.appendChild(startDateInput);
    popupContent.appendChild(endDateInput);
    popupContent.appendChild(generateButton);
    popupBackground.appendChild(popupContent);
    document.body.appendChild(popupBackground);
}

      function generateHTMLReport(filteredSales, startDate, endDate, total) {
    // Formata as datas para o padrão dd/mm/yyyy
    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    // Carrega o nome ou empresa salvo no popup Config.
    const companyName = GM_getValue('companyName', 'Nome/Empresa não informado');

    // Cria o conteúdo HTML do relatório
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Vendas</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .total { font-weight: bold; margin-top: 20px; text-align: right; }
            </style>
        </head>
        <body>
            <h1>Relatório de Vendas</h1>
            <p><strong>Empresa/Nome:</strong> ${companyName}</p>
            <p><strong>Período:</strong> ${formattedStartDate} até ${formattedEndDate}</p>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Cliente</th>
                        <th>Produto</th>
                        <th>Nº Pedido</th>
                        <th>Observações</th>
                        <th>Valor (R$)</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredSales
                        .map(
                            sale => `
                                <tr>
                                    <td>${formatDate(new Date(sale.date))}</td>
                                    <td>${sale.client || '-'}</td>
                                    <td>${sale.product || '-'}</td>
                                    <td>${sale.orderNumber || '-'}</td>
                                    <td>${sale.observations || '-'}</td>
                                    <td>R$ ${sale.amount.toFixed(2)}</td>
                                </tr>
                            `
                        )
                        .join('')}
                </tbody>
            </table>
            <div class="total">Total de Faturamento: R$ ${total.toFixed(2)}</div>
        </body>
        </html>
    `;

    // Cria um Blob com o conteúdo HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });

    // Cria um link para download do arquivo
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_vendas.html';
    a.click();

    // Libera a URL do Blob após o download
    URL.revokeObjectURL(url);
}
        updateSalesList();
        updateTotalSales();
        loadContacts();
    }

    // Função para alternar a exibição do painel CRM
    function toggleCRMBoard() {
        let board = document.getElementById('crmBoard');
        board.style.display = (board.style.display === 'none') ? 'flex' : 'none';
        applyBackground(); // Aplica o fundo no painel CRM ao alternar
    }

    // Função para criar contatos arrastáveis
    function createDraggableContact(name, observation = '') {
        let contact = document.createElement('div');
        contact.innerText = name;
        contact.classList.add('contact');
        contact.style.border = '1px solid #ccc';
        contact.style.padding = '8px';
        contact.style.borderRadius = '5px';
        contact.style.background = '#fff';
        contact.style.cursor = 'grab';
        contact.style.color = '#000';
        contact.style.overflow = 'hidden'; // Garantir que o conteúdo não ultrapasse os limites do contato
        contact.draggable = true;
        contact.style.boxShadow = '2px 2px 5px rgba(0,0,0,0.1)';
        contact.id = `contact-${name.replace(/\s/g, '')}`;
        contact.ondragstart = (e) => e.dataTransfer.setData('text', contact.id);
        // Adiciona o atributo "data-observation" para armazenar a observação
        contact.dataset.observation = observation;
        // Criação ou exibição da área de descrição
        let descriptionArea = document.createElement('textarea');
        descriptionArea.style.width = '100%';
        descriptionArea.style.minHeight = '60px';
        descriptionArea.style.marginTop = '5px';
        descriptionArea.style.border = '1px solid #ccc';
        descriptionArea.style.borderRadius = '5px';
        descriptionArea.style.resize = 'vertical';
        descriptionArea.style.display = 'none'; // Inicialmente escondido
        descriptionArea.value = observation;
        contact.appendChild(descriptionArea);
        // Ao clicar duas vezes no contato, exibe o campo de descrição para edição
        contact.ondblclick = () => {
            descriptionArea.style.display = 'block';
            descriptionArea.focus();
            // Quando o usuário terminar de editar, salva a observação
            descriptionArea.onblur = () => {
                contact.dataset.observation = descriptionArea.value.trim();
                saveContacts();
                descriptionArea.style.display = 'none'; // Esconde o campo de edição novamente
            };
        };
        return contact;
    }

    function saveContacts() {
        let contactsData = {};
        document.querySelectorAll('.crmColumn').forEach(column => {
            let stage = column.getAttribute('data-stage');
            contactsData[stage] = [];
            column.querySelectorAll('.contact').forEach(contact => {
                contactsData[stage].push({
                    name: contact.innerText.trim(),
                    observation: contact.dataset.observation || '' // Salva a observação
                });
            });
        });
        GM_setValue('crmContacts', JSON.stringify(contactsData));
    }

    // Função para carregar os contatos salvos
    function loadContacts() {
        let contactsData = JSON.parse(GM_getValue('crmContacts', '{}'));
        Object.keys(contactsData).forEach(stage => {
            let column = document.querySelector(`[data-stage='${stage}']`);
            contactsData[stage].forEach(contactData => {
                let contact = createDraggableContact(contactData.name, contactData.observation);
                column.appendChild(contact);
            });
        });
    }

    // Inicialização do painel CRM
    setTimeout(() => {
        createToggleButton();
        createCRMBoard();
    }, 5000);
})();