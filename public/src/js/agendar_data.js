// Este script é para a página de seleção de data e hora (agendar_data.html)

const { createApp } = Vue;

// Função auxiliar para formatar datas em "YYYY-MM-DD" para consistência
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

createApp({
  data() {
    return {
      agendamentoProvisorio: {
        servico: null,
        profissional: null,
        data: null,
        horario: null,
      },
      currentUser: null, // Para armazenar o UID do cliente logado

      // Dados do calendário
      mesAtual: new Date().getMonth(),
      anoAtual: new Date().getFullYear(),
      diasDaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      
      dataSelecionada: null,
      horarioSelecionado: null,

      // Horários de trabalho padrão (por enquanto, fixos)
      // Futuramente, isso poderia vir do Firestore por profissional
      // Exemplo: 9h às 18h com 12h-13h de almoço
      horariosTrabalhoPadrao: [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
      ],
      // Substituirá por horários realmente disponíveis do Firestore
      horariosDisponiveis: [], 
    };
  },
  computed: {
    mesAtualNome() {
      const data = new Date(this.anoAtual, this.mesAtual);
      return data.toLocaleDateString('pt-BR', { month: 'long' });
    },
    diasDoMes() {
      const primeiroDiaDoMes = new Date(this.anoAtual, this.mesAtual, 1);
      const ultimoDiaDoMes = new Date(this.anoAtual, this.mesAtual + 1, 0);
      const numeroDeDias = ultimoDiaDoMes.getDate();
      const diaDaSemanaPrimeiroDia = primeiroDiaDoMes.getDay(); // 0 (Dom) a 6 (Sáb)

      let dias = [];

      // Preencher dias vazios no início do mês
      for (let i = 0; i < diaDaSemanaPrimeiroDia; i++) {
        dias.push({ vazio: true });
      }

      // Preencher dias do mês
      for (let i = 1; i <= numeroDeDias; i++) {
        const data = new Date(this.anoAtual, this.mesAtual, i);
        const disponivel = this.isDiaDisponivel(data);
        dias.push({
          data: data,
          disponivel: disponivel,
          vazio: false
        });
      }
      return dias;
    }
  },
  methods: {
    // Carrega dados do sessionStorage e verifica autenticação
    async carregarDadosIniciais() {
      const servicoData = sessionStorage.getItem('agendamento_servico');
      const profissionalData = sessionStorage.getItem('agendamento_profissional');

      if (servicoData && profissionalData) {
        this.agendamentoProvisorio.servico = JSON.parse(servicoData);
        this.agendamentoProvisorio.profissional = JSON.parse(profissionalData);
      } else {
        alert('Por favor, selecione o serviço e o profissional primeiro.');
        window.location.href = 'agendar_servico.html'; // Redireciona de volta
        return;
      }

      // Verifica autenticação do usuário
      firebase.auth().onAuthStateChanged(async (user) => {
        if (!user) {
          window.location.href = 'index.html';
          return;
        }
        try {
          const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
          if (!userDoc.exists || (userDoc.data().tipo || '').trim() !== 'cliente') {
            console.warn('Usuário não autorizado na página de agendamento de data. Redirecionando.');
            await firebase.auth().signOut();
            window.location.href = 'index.html';
            return;
          }
          this.currentUser = user; // Armazena o objeto user para pegar o UID
        } catch (error) {
          console.error('Erro na verificação de autenticação/tipo:', error);
          await firebase.auth().signOut();
          window.location.href = 'index.html';
        }
      });
    },

    isDiaDisponivel(date) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zera a hora para comparação de data
      const dataParaVerificar = new Date(date);
      dataParaVerificar.setHours(0, 0, 0, 0);

      const diaDaSemana = dataParaVerificar.getDay(); // 0 = Domingo, 6 = Sábado

      // Desabilita sábados e domingos por padrão
      if (diaDaSemana === 0 || diaDaSemana === 6) { // Domingo ou Sábado
        return false;
      }

      // Regra para Justin e Angela: disponível 2 dias depois da data atual
      if (this.agendamentoProvisorio.profissional.id === 'justin' || this.agendamentoProvisorio.profissional.id === 'angela') {
        const doisDiasDepois = new Date(hoje);
        doisDiasDepois.setDate(hoje.getDate() + 2);
        doisDiasDepois.setHours(0,0,0,0); // Zera para comparação apenas da data

        return dataParaVerificar >= doisDiasDepois;
      } 
      // Regra para Caio: disponível no dia atual, se for dia útil
      else if (this.agendamentoProvisorio.profissional.id === 'caio') {
        return dataParaVerificar >= hoje; // Caio pode agendar a partir de hoje (se for dia útil, já filtrado acima)
      }

      return false; // Caso padrão, se não for nenhum dos profissionais
    },

    prevMonth() {
      if (this.mesAtual === 0) {
        this.mesAtual = 11;
        this.anoAtual--;
      } else {
        this.mesAtual--;
      }
      this.dataSelecionada = null; // Limpa a seleção ao mudar o mês
      this.horarioSelecionado = null;
    },
    nextMonth() {
      if (this.mesAtual === 11) {
        this.mesAtual = 0;
        this.anoAtual++;
      } else {
        this.mesAtual++;
      }
      this.dataSelecionada = null; // Limpa a seleção ao mudar o mês
      this.horarioSelecionado = null;
    },

    selecionarData(data) {
      // Garante que a data selecionada seja um objeto Date correto
      const novaData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      this.dataSelecionada = novaData;
      this.horarioSelecionado = null; // Limpa o horário ao selecionar nova data
      this.carregarHorariosDisponiveis(novaData);
    },

    async carregarHorariosDisponiveis(data) {
      const dataFormatada = formatDate(data); // "YYYY-MM-DD"
      const profissionalId = this.agendamentoProvisorio.profissional.id;

      // Buscar agendamentos existentes para este profissional nesta data
      const agendamentosSnapshot = await firebase.firestore().collection('agendamentos')
        .where('profissional.id', '==', profissionalId)
        .where('dataAgendamento', '==', dataFormatada)
        .get();

      const horariosOcupados = agendamentosSnapshot.docs.map(doc => doc.data().horarioAgendamento);
      console.log('Horários ocupados para', dataFormatada, 'e', profissionalId, ':', horariosOcupados);

      // Filtrar horários padrão, removendo os que já estão ocupados
      this.horariosDisponiveis = this.horariosTrabalhoPadrao.filter(horario => 
        !horariosOcupados.includes(horario)
      );
    },

    selecionarHorario(horario) {
      this.horarioSelecionado = horario;
    },

    async confirmarAgendamento() {
      if (!this.dataSelecionada || !this.horarioSelecionado || !this.agendamentoProvisorio.servico || !this.agendamentoProvisorio.profissional || !this.currentUser) {
        alert('Por favor, complete todas as informações do agendamento.');
        return;
      }

      const novoAgendamentoData = { // Objeto de dados para o Firestore
        clienteUid: this.currentUser.uid,
        clienteEmail: this.currentUser.email, // Opcional, para facilitar a visualização
        servico: this.agendamentoProvisorio.servico,
        profissional: this.agendamentoProvisorio.profissional,
        dataAgendamento: formatDate(this.dataSelecionada), // Formato YYYY-MM-DD
        horarioAgendamento: this.horarioSelecionado,
        status: 'pendente', // Pode ser 'pendente', 'confirmado', 'cancelado', 'concluido'
        criadoEm: firebase.firestore.FieldValue.serverTimestamp() // Data e hora do registro
      };

      try {
        // Captura a referência do documento que foi adicionado para obter o ID
        const docRef = await firebase.firestore().collection('agendamentos').add(novoAgendamentoData);
        const agendamentoIdGerado = docRef.id; // ESTA É A LINHA CRUCIAL!

        // Limpa sessionStorage após agendamento bem-sucedido
        sessionStorage.removeItem('agendamento_servico');
        sessionStorage.removeItem('agendamento_profissional');

        alert('Agendamento realizado com sucesso!');
        // Redireciona para a tela de confirmação/resumo, passando o ID correto
        window.location.href = `agendamento_confirmacao.html?agendamentoId=${agendamentoIdGerado}`; 
      } catch (error) {
        console.error('Erro ao salvar agendamento:', error);
        alert('Ocorreu um erro ao agendar. Por favor, tente novamente.');
      }
    },

    voltar() {
        window.location.href = 'agendar_profissional.html';
    }
  },
  mounted() {
    this.carregarDadosIniciais();
    // A computada `diasDoMes` já inicializa o calendário para o mês atual.
    // Não é necessário chamar carregarHorariosDisponiveis aqui diretamente no mounted,
    // pois ele será chamado quando uma data for selecionada.
  }
}).mount('#app-agendar-data');