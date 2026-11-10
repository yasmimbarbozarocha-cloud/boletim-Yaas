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

        let notasValidas = [n1, n2, n3].filter(n => n !== null);
        let media = null;

        if (notasValidas.length > 0) {
            let soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
            media = soma / notasValidas.length;
            somaMediasGerais += media;
            totalMediasValidas++;
        }

        let totalFaltasDisc = faltasArray.reduce((acc, curr) => Number(acc) + Number(curr), 0);
        acumuladorFaltasGerais += totalFaltasDisc;

        let situacaoTexto = "Nota ainda não disponível";
        let situacaoClasse = "situacao-indisponivel";

        if (media !== null) {
            if (media >= 6.0) {
                situacaoTexto = "Bom desempenho";
                situacaoClasse = "situacao-bom";
                qtdBomDesempenho++;
            } else {
                situacaoTexto = "Atenção";
                situacaoClasse = "situacao-atencao";
                qtdAtencao++;
            }
        }

        const formatarExibicao = (nota) => nota !== null ? nota.toFixed(1).replace('.', ',') : '—';

        const tr = document.createElement("tr");

        if (!emModoEdicao) {
            // Visualização Normal
            const tdDisc = document.createElement("td");
            const strongDisc = document.createElement("strong");
            strongDisc.textContent = item.disciplina;
            tdDisc.appendChild(strongDisc);

            const tdTri1 = document.createElement("td");
            tdTri1.textContent = formatarExibicao(n1);

            const tdTri2 = document.createElement("td");
            tdTri2.textContent = formatarExibicao(n2);

            const tdTri3 = document.createElement("td");
            tdTri3.textContent = formatarExibicao(n3);

            const tdMedia = document.createElement("td");
            const strongMedia = document.createElement("strong");
            strongMedia.textContent = formatarExibicao(media);
            tdMedia.appendChild(strongMedia);

            const tdFaltas = document.createElement("td");
            tdFaltas.textContent = totalFaltasDisc;

            const tdSit = document.createElement("td");
            tdSit.className = situacaoClasse;
            tdSit.textContent = situacaoTexto;

            tr.appendChild(tdDisc);
            tr.appendChild(tdTri1);
            tr.appendChild(tdTri2);
            tr.appendChild(tdTri3);
            tr.appendChild(tdMedia);
            tr.appendChild(tdFaltas);
            tr.appendChild(tdSit);
        } else {
            // Modo de Edição
            const tdDisc = document.createElement("td");
            const strongDisc = document.createElement("strong");
            strongDisc.textContent = item.disciplina;
            tdDisc.appendChild(strongDisc);

            const formatarParaInput = (v) => {
                let n = normalizarNota(v);
                return n !== null ? String(n).replace('.', ',') : '';
            };

            const tdTri1 = document.createElement("td");
            tdTri1.innerHTML = `<input type="text" class="input-nota" id="edit-tri1-${index}" value="${formatarParaInput(item.tri1)}">`;

            const tdTri2 = document.createElement("td");
            tdTri2.innerHTML = `<input type="text" class="input-nota" id="edit-tri2-${index}" value="${formatarParaInput(item.tri2)}">`;

            const tdTri3 = document.createElement("td");
            tdTri3.innerHTML = `<input type="text" class="input-nota" id="edit-tri3-${index}" value="${formatarParaInput(item.tri3)}">`;

            const tdMedia = document.createElement("td");
            const strongMedia = document.createElement("strong");
            strongMedia.textContent = formatarExibicao(media);
            tdMedia.appendChild(strongMedia);

            const tdFaltas = document.createElement("td");
            tdFaltas.innerHTML = `
                <div class="grupo-faltas">
                    <input type="text" class="input-falta" id="edit-f1-${index}" value="${faltasArray[0] ?? 0}" title="1º Tri">
                    <input type="text" class="input-falta" id="edit-f2-${index}" value="${faltasArray[1] ?? 0}" title="2º Tri">
                    <input type="text" class="input-falta" id="edit-f3-${index}" value="${faltasArray[2] ?? 0}" title="3º Tri">
                </div>
            `;

            const tdSit = document.createElement("td");
            tdSit.className = situacaoClasse;
            tdSit.textContent = situacaoTexto;

            tr.appendChild(tdDisc);
            tr.appendChild(tdTri1);
            tr.appendChild(tdTri2);
            tr.appendChild(tdTri3);
            tr.appendChild(tdMedia);
            tr.appendChild(tdFaltas);
            tr.appendChild(tdSit);
        }

        corpoTabela.appendChild(tr);
    });

    // Atualiza Cards de Resumo
    const mediaGeralFinal = totalMediasValidas > 0 ? (somaMediasGerais / totalMediasValidas).toFixed(1).replace('.', ',') : '—';
    
    document.getElementById("media-geral").innerText = mediaGeralFinal;
    document.getElementById("total-faltas").innerText = acumuladorFaltasGerais;
    document.getElementById("bom-desempenho").innerText = qtdBomDesempenho;
    document.getElementById("atencao").innerText = qtdAtencao;
}

// Ações do Botão de Edição
function abrirEdicao() {
    emModoEdicao = true;
    document.getElementById("btn-alterar").style.display = "none";
    document.getElementById("btn-salvar").style.display = "inline-block";
    document.getElementById("btn-cancelar").style.display = "inline-block";
    document.getElementById("mensagem-boletim").innerText = "";
    renderizarBoletim();
}

function cancelarEdicao() {
    emModoEdicao = false;
    document.getElementById("btn-alterar").style.display = "inline-block";
    document.getElementById("btn-salvar").style.display = "none";
    document.getElementById("btn-cancelar").style.display = "none";
    document.getElementById("mensagem-boletim").innerText = "";
    renderizarBoletim();
}

// Salvar Alterações na API
async function salvarDados() {
    const msgBoletim = document.getElementById("mensagem-boletim");
    msgBoletim.style.color = "#d63031";
    msgBoletim.innerText = "";

    // Limpa destaque de campos inválidos
    document.querySelectorAll(".campo-invalido").forEach(el => el.classList.remove("campo-invalido"));

    let temErro = false;
    let novasDisciplinas = [];

    for (let i = 0; i < dadosBoletimAtual.length; i++) {
        let elTri1 = document.getElementById(`edit-tri1-${i}`);
        let elTri2 = document.getElementById(`edit-tri2-${i}`);
        let elTri3 = document.getElementById(`edit-tri3-${i}`);

        let elF1 = document.getElementById(`edit-f1-${i}`);
        let elF2 = document.getElementById(`edit-f2-${i}`);
        let elF3 = document.getElementById(`edit-f3-${i}`);

        let resTri1 = validarNotaEditada(elTri1.value);
        let resTri2 = validarNotaEditada(elTri2.value);
        let resTri3 = validarNotaEditada(elTri3.value);

        let resF1 = validarFaltaEditada(elF1.value);
        let resF2 = validarFaltaEditada(elF2.value);
        let resF3 = validarFaltaEditada(elF3.value);

        if (!resTri1.valido) { elTri1.classList.add("campo-invalido"); temErro = true; }
        if (!resTri2.valido) { elTri2.classList.add("campo-invalido"); temErro = true; }
        if (!resTri3.valido) { elTri3.classList.add("campo-invalido"); temErro = true; }

        if (!resF1.valido) { elF1.classList.add("campo-invalido"); temErro = true; }
        if (!resF2.valido) { elF2.classList.add("campo-invalido"); temErro = true; }
        if (!resF3.valido) { elF3.classList.add("campo-invalido"); temErro = true; }

        if (!temErro) {
            novasDisciplinas.push({
                disciplina: dadosBoletimAtual[i].disciplina,
                tri1: resTri1.valor,
                tri2: resTri2.valor,
                tri3: resTri3.valor,
                faltas: [resF1.valor, resF2.valor, resF3.valor]
            });
        }
    }

    if (temErro) {
        msgBoletim.innerText = "Por favor, corrija os campos marcados em vermelho. Notas aceitam apenas valores de 0 a 10 e faltas devem ser números inteiros.";
        return;
    }

    msgBoletim.style.color = "#6c5ce7";
    msgBoletim.innerText = "Salvando...";

    try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                turma: CONFIG_ALUNO.turma,
                numero_chamada: CONFIG_ALUNO.numeroChamada,
                pin: pinSessao,
                dados: {
                    disciplinas: novasDisciplinas
                }
            })
        });

        if (!resposta.ok) {
            msgBoletim.style.color = "#d63031";
            msgBoletim.innerText = "Não foi possível salvar as alterações no servidor. Tente novamente.";
            return;
        }

        dadosBoletimAtual = novasDisciplinas;
        emModoEdicao = false;

        document.getElementById("btn-alterar").style.display = "inline-block";
        document.getElementById("btn-salvar").style.display = "none";
        document.getElementById("btn-cancelar").style.display = "none";

        msgBoletim.style.color = "#00b894";
        msgBoletim.innerText = "Dados salvos com sucesso.";

        renderizarBoletim();

    } catch (erro) {
        msgBoletim.style.color = "#d63031";
        msgBoletim.innerText = "Não foi possível salvar as alterações no servidor. Tente novamente.";
    }
}