// Este script é para a página de seleção de profissional (agendar_profissional.html)

const { createApp } = Vue;

createApp({
  data() {
    return {
      profissionais: [
        { id: 'justin', nome: 'Justin', imagem: 'images/profissional-justin.png' }, // Adicione o caminho da imagem de Justin
        { id: 'angela', nome: 'Angela', imagem: 'images/profissional-angela.png' }, // Adicione o caminho da imagem de Angela
        { id: 'caio', nome: 'Caio', imagem: 'images/profissional-caio.png' },     // Adicione o caminho da imagem de Caio
      ],
      servicoSelecionado: null,     // Para exibir o serviço selecionado da tela anterior
      profissionalSelecionado: null, // Armazenará o profissional que o cliente escolher
    };
  },
  methods: {
    selecionarProfissional(profissional) {
      this.profissionalSelecionado = profissional;
    },
    proximaEtapa() {
      if (this.profissionalSelecionado) {
        // Armazena o profissional selecionado no sessionStorage
        sessionStorage.setItem('agendamento_profissional', JSON.stringify(this.profissionalSelecionado));
        window.location.href = 'agendar_data.html'; // Redireciona para a próxima etapa (seleção de data)
      } else {
        alert('Por favor, selecione um profissional para continuar.');
      }
    },
    voltar() {
        // Volta para a tela de seleção de serviço
        window.location.href = 'agendar_servico.html'; 
    },
    carregarServicoSelecionado() {
        const servicoData = sessionStorage.getItem('agendamento_servico');
        if (servicoData) {
            this.servicoSelecionado = JSON.parse(servicoData);
        } else {
            // Se não houver serviço selecionado na sessão, talvez redirecionar de volta
            // ou mostrar um erro. Por enquanto, apenas um aviso.
            console.warn('Nenhum serviço selecionado encontrado. Redirecionando para seleção de serviço.');
            alert('Por favor, selecione um serviço primeiro.');
            window.location.href = 'agendar_servico.html';
        }
    }
  },
  mounted() {
    this.carregarServicoSelecionado(); // Carrega o serviço ao montar a página

    // Verifica autenticação para esta página
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      try {
        const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
        if (!userDoc.exists || (userDoc.data().tipo || '').trim() !== 'cliente') {
          console.warn('Usuário não autorizado na página de agendamento de profissional. Redirecionando.');
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
}).mount('#app-agendar-profissional');