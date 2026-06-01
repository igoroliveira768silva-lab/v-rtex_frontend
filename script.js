let input = document.getElementById("ask");
let resposta = document.getElementById("fala");
let enviar = document.getElementById("enviar");

let banco_dadosTurma = null;

// 1. Carrega o JSON da turma na inicialização
async function getDataTurma(){
  try {
    let response = await fetch('../backend/dados.json');
    if(!response.ok) throw new Error("Erro ao pegar o json");
    banco_dadosTurma = await response.json();
    console.log("Matrix: Banco de dados da turma carregado na RAM!");
  } catch(erro) {
    console.error(erro);
  }
}
getDataTurma();

function talk(fala){
  window.speechSynthesis.cancel();
  let mensagem = new SpeechSynthesisUtterance(fala);
  mensagem.lang = "pt-BR";
  mensagem.rate = 1.1;

  let rastro = new SpeechSynthesisUtterance("");
  window.speechSynthesis.speak(rastro);
  window.speechSynthesis.speak(mensagem);

  mensagem.onstart = () => console.log("Vórtex começou a falar!");
  mensagem.onerror = (evento) => console.error("Erro na fala da Vórtex:", evento.error);
}

// Envia a string final para o parâmetro do Flask antigo
async function getData(perguntaCompleta){
  try {
    let response = await fetch(`http://127.0.0.1:5000/ia?pergunta=${encodeURIComponent(perguntaCompleta)}`);
    if(!response.ok) throw new Error('erro:' + response.status);
    return response.json();
  } catch(erro) {
    console.error(erro);
  }
}

enviar.addEventListener("click", async () => {
  let ask = input.value;
  if (!ask.trim()) return; 
  
  input.value = "";
  resposta.innerText = "Processando comando na Matrix...";

  // 2. Resgata o histórico de conversas do navegador
  let historico = JSON.parse(localStorage.getItem("vortex_chat")) || [];

  // 3. Monta o bloco de dados da turma se ele existir
  let dadosFormatados = banco_dadosTurma ? JSON.stringify(banco_dadosTurma) : "Sem dados no momento";

  // 4. Injeta a nova pergunta no histórico
  historico.push({ role: "user", parts: [ask] });

  // 5. MONTAGEM DO SUPER PROMPT CRUCIAL:
  // Juntamos as Instruções Secretas + O Banco de Dados da Turma + O Histórico de Conversas
  // Tudo isso vira uma única string gigante que o Flask antigo consegue ler!
  let promptComHistorico = `
Instrução do Sistema: Você é a Vórtex, uma IA cyberpunk, sarcástica,mimada,orgulhosa e se acha a melhor ia do mundo, fofinha e cheia de atitude, criada por Igor Oliveira para ser existir em um oculos de ai co.o um produto que analisa e ajuda o usuario. Você está no terceiro ano da escola no. Use o banco de dados e o histórico abaixo para responder de forma zoeira e natural. Se te chamarem de 'Ateu', saiba que esse é o apelido do seu criador Igor, defenda-o! Use gírias  (mermão, paia, é o novo, racha, crazyfrog, ) e jargões de tecnologia.

[BANCO DE DADOS DA TURMA]
${dadosFormatados}

[HISTÓRICO ATUAL DA CONVERSA]
${JSON.stringify(historico)}

[ÚLTIMA PERGUNTA DO USUÁRIO]
${ask}
  `;

  // 6. Envia tudo envelopado para o Python
  let Vortex_response = await getData(promptComHistorico);

  if (!Vortex_response) {
    resposta.innerText = "Erro na Matrix. Tente novamente.";
    return;
  }

  let falaVortex = Vortex_response.vortex_fala;

  // 7. Salva a resposta da Vórtex no histórico para a próxima pergunta
  historico.push({ role: "model", parts: [falaVortex] });
  localStorage.setItem("vortex_chat", JSON.stringify(historico));

  // 8. Atualiza a tela e solta o som
  resposta.innerText = falaVortex;
  talk(falaVortex);
});
