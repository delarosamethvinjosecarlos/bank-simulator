describe('Flujo de Transferencias Internacionales (BBVA Mock)', () => {

    beforeEach(() => {
        // Cargamos la aplicación desde el servidor local configurado en cypress.config.js
        cy.visit('/');
    });

    it('TC-01: Debería completar una transferencia internacional válida', () => {
        // Seleccionamos cuenta con saldo
        cy.get('#origen').select('1500'); 
        
        // Escribimos IBAN válido de Francia (Criterio de negocio aceptado)
        cy.get('[data-cy="iban-input"]').type('FR76 3000 1234 5678');
        
        // Importe dentro del saldo
        cy.get('[data-cy="amount-input"]').type('500');
        
        cy.get('[data-cy="submit-btn"]').click();
        
        // Validación del mensaje de éxito
        cy.get('#message')
          .should('be.visible')
          .and('have.class', 'success')
          .and('contain', 'procesada con éxito');
    });

    it('TC-02: Debería fallar si los fondos son insuficientes', () => {
        // Seleccionamos la cuenta con solo 50€ de saldo
        cy.get('#origen').select('50'); 
        
        cy.get('[data-cy="iban-input"]').type('DE89 3704 0044 0532');
        
        // Intentamos enviar más dinero del que hay
        cy.get('[data-cy="amount-input"]').type('200');
        
        cy.get('[data-cy="submit-btn"]').click();
        
        cy.get('#message')
          .should('be.visible')
          .and('have.class', 'error')
          .and('contain', 'Fondos insuficientes');
    });

    it('TC-03: Debería aplicar el bloqueo de seguridad antiblanqueo (+10k)', () => {
        cy.get('#origen').select('1500'); // Validar la regla independientemente del saldo base para el test
        
        // Modificamos el DOM local solo para forzar el test de la regla de los 10k
        cy.get('#origen').invoke('val', '20000'); 
        
        cy.get('[data-cy="iban-input"]').type('IT02 L050 0001 2345');
        cy.get('[data-cy="amount-input"]').type('12000');
        cy.get('[data-cy="submit-btn"]').click();
        
        cy.get('#message')
          .should('be.visible')
          .and('have.class', 'error')
          .and('contain', 'límite antiblanqueo');
    });

    it('TC-04: Debería rechazar un IBAN de un país no autorizado', () => {
        cy.get('#origen').select('1500'); 
        
        // Ponemos un IBAN de España (ES) cuando el sistema espera FR, DE o IT
        cy.get('[data-cy="iban-input"]').type('ES91 2100 0418 4512');
        cy.get('[data-cy="amount-input"]').type('100');
        
        cy.get('[data-cy="submit-btn"]').click();
        
        cy.get('#message')
          .should('be.visible')
          .and('have.class', 'error')
          .and('contain', 'IBAN debe pertenecer a un país autorizado');
    });

});
