// Dados Fictícios Padronizados — 9º Ano
const dadosBoletim = [
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

// NOTA: A frequência de 92% exibida no card é fictícia/demonstrativa nesta etapa do projeto.

// Função para normalizar qualquer formato de nota para a escala de 0 a 10
function normalizarNota(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return null;
    }

    // Se for string, substitui vírgula por ponto
    if (typeof valor === 'string') {
        valor = valor.replace(',', '.');
    }

    let num = Number(valor);

    // Se não for um número válido, descarta
    if (isNaN(num)) {
        return null;
    }

    // Regra: valores entre 0 e 10
    if (num >= 0 && num <= 10) {
        return num;
    }

    // Regra: valores entre 10 e 100 (ex: 82 vira 8.2)
    if (num > 10 && num <= 100) {
        return num / 10;
    }

    // Valores fora das regras
    return null;
}

// Função principal que processa os dados e preenche a tela
function carregarBoletim() {
    const corpoTabela = document.getElementById("corpo-tabela");
    corpoTabela.innerHTML = "";

    let somaMediasGerais = 0;
    let totalMediasValidas = 0;
    let acumuladorFaltasGerais = 0;
    let qtdBomDesempenho = 0;
    let qtdAtencao = 0;

    dadosBoletim.forEach(item => {
        // Normaliza as notas dos 3 trimestres
        const n1 = normalizarNota(item.tri1);
        const n2 = normalizarNota(item.tri2);
        const n3 = normalizarNota(item.tri3);

        // Calcula a média considerando apenas notas válidas
        let notasValidas = [n1, n2, n3].filter(n => n !== null);
        let media = null;

        if (notasValidas.length > 0) {
            let soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
            media = soma / notasValidas.length;
            somaMediasGerais += media;
            totalMediasValidas++;
        }

        // Calcula total de faltas da disciplina
        let totalFaltasDisc = item.faltas.reduce((acc, curr) => acc + curr, 0);
        acumuladorFaltasGerais += totalFaltasDisc;

        // Define situação da disciplina
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

        // Função auxiliar para formatar a nota no HTML
        const formatarExibicao = (nota) => nota !== null ? nota.toFixed(1).replace('.', ',') : '—';

        // Cria a linha da tabela
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${item.disciplina}</strong></td>
            <td>${formatarExibicao(n1)}</td>
            <td>${formatarExibicao(n2)}</td>
            <td>${formatarExibicao(n3)}</td>
            <td><strong>${formatarExibicao(media)}</strong></td>
            <td>${totalFaltasDisc}</td>
            <td class="${situacaoClasse}">${situacaoTexto}</td>
        `;

        corpoTabela.appendChild(tr);
    });

    // Atualiza os Cards de Resumo
    const mediaGeralFinal = totalMediasValidas > 0 ? (somaMediasGerais / totalMediasValidas).toFixed(1).replace('.', ',') : '—';
    
    document.getElementById("media-geral").innerText = mediaGeralFinal;
    document.getElementById("total-faltas").innerText = acumuladorFaltasGerais;
    document.getElementById("bom-desempenho").innerText = qtdBomDesempenho;
    document.getElementById("atencao").innerText = qtdAtencao;
}

// Executa a função ao carregar a página
document.addEventListener("DOMContentLoaded", carregarBoletim);