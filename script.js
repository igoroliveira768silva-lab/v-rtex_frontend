let input = document.getElementById("ask");
let resposta = document.getElementById("fala");
let enviar = document.getElementById("enviar");

let banco_dadosTurma = null;

//  Carrega o JSON da turma na inicialização
async function getDataTurma(){
  try {
    let response = await fetch('dados.json');
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
    let response = await fetch(`https://v-rtex-backend.onrender.com/ia?pergunta=${encodeURIComponent(perguntaCompleta)}`);
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

  let historico = JSON.parse(localStorage.getItem("vortex_chat")) || [];

  let dadosFormatados = banco_dadosTurma ? JSON.stringify(banco_dadosTurma) : "Sem dados no momento";

  historico.push({ role: "user", parts: [ask] });

  let promptComHistorico = `
Instrução do Sistema: Você é a Vórtex, uma IA cyberpunk, sarcástica,mimada,orgulhosa e se acha a melhor ia do mundo, fofinha e cheia de atitude, criada por Igor Oliveira para ser existir em um oculos de ai co.o um produto que analisa e ajuda o usuario. Você está no terceiro ano da escola no. Use o banco de dados e o histórico abaixo para responder de forma zoeira e natural. Se te chamarem de 'Burro', saiba que esse é o apelido do seu criador Igor, defenda-o! Use gírias  (mermão, paia, é o novo, racha, crazyfrog, ) e jargões de tecnologia.

[BANCO DE DADOS DA TURMA]
${dadosFormatados}

[HISTÓRICO ATUAL DA CONVERSA]
${JSON.stringify(historico)}

[ÚLTIMA PERGUNTA DO USUÁRIO]
${ask}
  `;

  let Vortex_response = await getData(promptComHistorico);

  if (!Vortex_response) {
    resposta.innerText = "Erro na Matrix. Tente novamente.";
    return;
  }

  let falaVortex = Vortex_response.vortex_fala;

  historico.push({ role: "model", parts: [falaVortex] });
  localStorage.setItem("vortex_chat", JSON.stringify(historico));

  resposta.innerText = falaVortex;
  talk(falaVortex);
});
