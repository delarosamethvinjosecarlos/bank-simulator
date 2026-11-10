describe('Flujo de Transferencias BBVA (React + FastAPI)', () => {
    
    // Variables para nuestro usuario de test
    const testUser = `qa_user_${Date.now()}`;
    const testPass = 'securePassword123';

    before(() => {
        // PRECONDICIÓN: Registramos al usuario directamente en la base de datos de Python vía API
        cy.request({
            method: 'POST',
            url: 'http://127.0.0.1:8000/register',
            body: { username: testUser, password: testPass },
            failOnStatusCode: false // Si falla porque existe, no importa
        });
    });

    beforeEach(() => {
        // En lugar de usar la UI de login, nos autenticamos por API para conseguir el JWT
        // (Esto es Shift-Left Testing puro y ahorra segundos en cada test)
        cy.request('POST', 'http://127.0.0.1:8000/login', { username: testUser, password: testPass })
          .then((response) => {
              // Inyectamos el Token JWT en el navegador
              window.localStorage.setItem('token', response.body.access_token);
          });
          
        // Visitamos la aplicación React (debería redirigir automáticamente al dashboard por el token)
        cy.visit('/');
    });

    it('TC-01: Debería completar una transferencia internacional válida', () => {
        // Nos aseguramos de estar en el Dashboard y que cargue el saldo
        cy.get('[data-cy="balance"]').should('be.visible');

        // Escribimos IBAN válido de Francia
        cy.get('[data-cy="transfer-iban"]').clear().type('FR76 3000 1234 5678');
        
        // Importe seguro
        cy.get('[data-cy="transfer-amount"]').clear().type('15.50');
        
        cy.get('[data-cy="transfer-btn"]').click();
        
        // Validación del mensaje de éxito (Tailwind React UI)
        cy.contains('Transferencia procesada con éxito').should('be.visible');
    });

    it('TC-02: Debería fallar si los fondos son insuficientes', () => {
        cy.get('[data-cy="balance"]').should('be.visible');
        
        cy.get('[data-cy="transfer-iban"]').clear().type('DE89 3704 0044 0532');
        
        // Intentamos enviar una burrada de dinero que supera los 1500 iniciales
        cy.get('[data-cy="transfer-amount"]').clear().type('2000');
        
        cy.get('[data-cy="transfer-btn"]').click();
        
        cy.contains('Fondos insuficientes').should('be.visible');
    });

    it('TC-03: Debería aplicar el bloqueo de seguridad antiblanqueo (+10k)', () => {
        cy.get('[data-cy="balance"]').should('be.visible');
        
        cy.get('[data-cy="transfer-iban"]').clear().type('IT02 0500 0012 3456');
        
        // Transferencia que dispara la regla de Compliance (Lavado de dinero) en el backend Python
        cy.get('[data-cy="transfer-amount"]').clear().type('12000');
        
        cy.get('[data-cy="transfer-btn"]').click();
        
        cy.contains('Bloqueo de Seguridad').should('be.visible');
    });

    it('TC-04: Debería rechazar un IBAN de un país no autorizado', () => {
        cy.get('[data-cy="balance"]').should('be.visible');
        
        // Ponemos un IBAN de España (ES) cuando el sistema espera internacionales FR, DE o IT
        cy.get('[data-cy="transfer-iban"]').clear().type('ES91 2100 0418 4512');
        cy.get('[data-cy="transfer-amount"]').clear().type('100');
        
        cy.get('[data-cy="transfer-btn"]').click();
        
        cy.contains('El IBAN debe pertenecer a un país autorizado').should('be.visible');
    });
});
