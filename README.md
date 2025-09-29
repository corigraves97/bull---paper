# bull---paper

##RESTful Routes

/welcome ---> this is our home landing page to sign in or sign-up
/sign-in
/sign-up

users/:userId ---> GET ---> This is the landing page when you login
users/:userId/journals ----> GET ----> List of My Journals
users/:userId/journals/new ---> CREATE ----> New journal entry
users/:userId/journals/:journalId ----> GET ----> View one journal entry
users/:userId/journals/:journalId/edit ----> UPDATE ----> edit your entry
users/:userId/journals/:journalId ----> DELETE ----> Just the delete button functionality

users/:userId/community ---> GET ----> Show list of other users


users/:userId/stock-history ----> GET ----> view my stock history

