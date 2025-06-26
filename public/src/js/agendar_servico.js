// Este script é para a página de seleção de serviço (agendar_servico.html)

const { createApp } = Vue;

createApp({
  data() {
    return {
      servicos: [
        { 
          id: 'corte-tesoura', 
          nome: 'Corte na Tesoura', 
          descricao: 'Corte clássico e preciso, feito inteiramente com tesoura, ideal para detalhes e texturas.', 
          tempo: 40, 
          valor: 40.00, 
          imagem: 'images/corte-tesoura.png' // APENAS A IMAGEM NORMAL
        },
        { 
          id: 'corte-maquina', 
          nome: 'Corte na Máquina', 
          descricao: 'Corte rápido e uniforme, utilizando máquina para um acabamento limpo e prático.', 
          tempo: 30, 
          valor: 25.00, 
          imagem: 'images/corte-maquina.png' // APENAS A IMAGEM NORMAL
        },
        { 
          id: 'progressiva', 
          nome: 'Progressiva', 
          descricao: 'Tratamento capilar para alisamento e redução de volume, deixando os fios mais lisos e brilhantes.', 
          tempo: 50, 
          valor: 70.00, 
          imagem: 'images/progressiva.png' // APENAS A IMAGEM NORMAL
        },
        { 
          id: 'degrade', 
          nome: 'Degradê', 
          descricao: 'Corte moderno com transição suave entre diferentes comprimentos, do curto ao mais longo.', 
          tempo: 30, 
          valor: 30.00, 
          imagem: 'images/degrade.png' // APENAS A IMAGEM NORMAL
        },
        { 
          id: 'corte-freestyle', 
          nome: 'Corte FreeStyle', 
          descricao: 'Corte personalizado e criativo, adaptado ao seu estilo e preferências únicas.', 
          tempo: 40, 
          valor: 50.00, 
          imagem: 'images/corte-freestyle.png' // APENAS A IMAGEM NORMAL
        },
        { 
          id: 'barba', 
          nome: 'Barba', 
          descricao: 'Modelagem e finalização de barba com toalha quente e produtos específicos para hidratação.', 
          tempo: 20, 
          valor: 20.00, 
          imagem: 'images/barba.png' // APENAS A IMAGEM NORMAL
        },
        { 
          id: 'combo-cabelo-barba', 
          nome: 'Combo Cabelo + Barba', 
          descricao: 'Pacote completo com corte de cabelo e modelagem de barba, para um visual renovado.', 
          tempo: 50, 
          valor: 80.00, 
          imagem: 'images/combo.png' // APENAS A IMAGEM NORMAL
        },
      ],
      servicoSelecionado: null,
    };
  },
  methods: {
    selecionarServico(servico) {
      this.servicoSelecionado = servico;
    },
    proximaEtapa() {
      if (this.servicoSelecionado) {
        sessionStorage.setItem('agendamento_servico', JSON.stringify(this.servicoSelecionado));
        window.location.href = 'agendar_profissional.html';
      } else {
        alert('Por favor, selecione um serviço para continuar.');
      }
    },
    voltar() {
        window.location.href = 'cliente.html';
    }
  },
  mounted() {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      try {
        const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || (userDoc.data().tipo || '').trim() !== 'cliente') {
          console.warn('Usuário não autorizado na página de agendamento. Redirecionando.');
          await firebase.auth().signOut();
          window.location.href = 'index.html';
        }
      } catch (error) {
        console.error('Erro na verificação de autenticação/tipo:', error);
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      }
    });
  }
}).mount('#app-agendar-servico');