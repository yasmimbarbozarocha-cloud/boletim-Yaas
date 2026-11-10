// Configuração fixa do aluno — Não alterar
const CONFIG_ALUNO = {
    turma: "9C",
    numeroChamada: 32,
    apiUrl: "https://boletim-api.profbt.com.br"
};

// PIN mantido apenas em memória durante a sessão
let pinSessao = "";

// Dados Fictícios Padronizados — 9º Ano (Dados base locais)
const dadosBoletimPadrao = [
    { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
    { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
    { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
    { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
    { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
    { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
    { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
    { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
    { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
    { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
    { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
    { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
    { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
    { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
    { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Estado atual dos dados exibidos na aplicação
let dadosBoletimAtual = [];
let emModoEdicao = false;

// Instâncias dos Gráficos (Chart.js)
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Função para normalizar qualquer formato de nota para a escala de 0 a 10 (Dados Antigos)
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    if (typeof valor === 'string') {
        valor = valor.replace(',', '.').trim();
        if (valor === "") return null;
    }

    let num = Number(valor);

    if (isNaN(num)) {
        return null;
    }

    if (num >= 0 && num <= 10) {
        return num;
    }

    if (num > 10 && num <= 100) {
        return num / 10;
    }

    return null;
}

// Validação estrita para as notas digitadas pelo usuário na edição
function validarNotaEditada(valorTexto) {
    if (valorTexto === null || valorTexto === undefined) return { valido: true, valor: null };
    
    let texto = String(valorTexto).trim();
    if (texto === "") return { valido: true, valor: null };

    texto = texto.replace(',', '.');
    let num = Number(texto);

    if (isNaN(num) || num < 0 || num > 10) {
        return { valido: false, valor: null };
    }

    return { valido: true, valor: num };
}

// Validação estrita para as faltas digitadas pelo usuário
function validarFaltaEditada(valorTexto) {
    if (valorTexto === null || valorTexto === undefined) return { valido: false, valor: null };
    
    let texto = String(valorTexto).trim();
    if (texto === "") return { valido: false, valor: null };

    // Verifica se é número inteiro
    if (!/^\d+$/.test(texto)) {
        return { valido: false, valor: null };
    }

    let num = Number(texto);
    if (isNaN(num) || num < 0) {
        return { valido: false, valor: null };
    }

    return { valido: true, valor: num };
}

// Função de Login e Busca dos Dados na API
async function fazerLogin() {
    const inputPin = document.getElementById("pin-input");
    const msgLogin = document.getElementById("mensagem-login");
    const pinDigitado = inputPin.value.trim();

    if (!pinDigitado) {
        msgLogin.style.color = "#d63031";
        msgLogin.innerText = "Por favor, digite o PIN.";
        return;
    }

    msgLogin.style.color = "#6c5ce7";
    msgLogin.innerText = "Conectando...";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinDigitado
            })
        });

        if (resposta.status === 401) {
            msgLogin.style.color = "#d63031";
            msgLogin.innerText = "Turma, chamada ou PIN inválidos.";
            return;
        }

        if (resposta.status === 429) {
            msgLogin.style.color = "#d63031";
            msgLogin.innerText = "Muitas tentativas. Aguarde um minuto e tente novamente.";
            return;
        }

        if (!resposta.ok) {
            msgLogin.style.color = "#d63031";
            msgLogin.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
            return;
        }

        const json = await resposta.json();

        // Guarda o PIN na memória da sessão e limpa a tela de login
        pinSessao = pinDigitado;
        inputPin.value = "";
        msgLogin.innerText = "";

        // Regra do servidor de dados salvos
        if (json.dados && Array.isArray(json.dados.disciplinas) && json.dados.disciplinas.length > 0) {
            dadosBoletimAtual = json.dados.disciplinas;
        } else {
            // Se for novo ou dados null, usa os dados fictícios padrão
            dadosBoletimAtual = JSON.parse(JSON.stringify(dadosBoletimPadrao));
        }

        document.getElementById("area-login").style.display = "none";
        document.getElementById("conteudo-boletim").style.display = "block";

        renderizarBoletim();
        atualizarGraficos();

    } catch (erro) {
        msgLogin.style.color = "#d63031";
        msgLogin.innerText = "Não foi possível conectar ao servidor. Tente novamente.";
    }
}

// Renderização dos Dados na Tabela e nos Cards
function renderizarBoletim() {
    const corpoTabela = document.getElementById("corpo-tabela");
    corpoTabela.innerHTML = "";

    let somaMediasGerais = 0;
    let totalMediasValidas = 0;
    let acumuladorFaltasGerais = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    dadosBoletimAtual.forEach((item, index) => {
        let n1 = normalizarNota(item.tri1);
        let n2 = normalizarNota(item.tri2);
        let n3 = normalizarNota(item.tri3);

        let faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];

        let notasValidas = [n1