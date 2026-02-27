;; Notary contract
;; Stores mapping: hash (buff 32) -> owner principal
;; Only stores the owner (tx-sender) who called `notarize`.
;; Timestamping / exact block/time can be derived from the transaction that called `notarize` via the Stacks API.

;; Error constants
(define-constant ERR-ALREADY-NOTARIZED (err u100))
(define-constant ERR-INVALID-HASH (err u101))

;; Map to store notarizations: hash -> owner
(define-map notarizations 
  { hash: (buff 32) } 
  { owner: principal }
)

;; Notarize a hash on the blockchain
;; This creates a permanent timestamp proof that the hash existed at this block
;;
;; Arguments:
;; - h: The hash to notarize (32 bytes)
;;
;; Returns:
;; - (ok true) on success
;; - Error if hash already notarized by different owner
(define-public (notarize (h (buff 32)))
  (begin
    ;; Validate hash is not empty
    (asserts! (> (len h) u0) ERR-INVALID-HASH)
    
    ;; Check if hash already exists
    (let ((existing (map-get? notarizations { hash: h })))
      (match existing
        record 
        ;; Hash already exists, check if same owner
        (if (is-eq (get owner record) tx-sender)
            (ok true) ;; Same owner, allow re-notarization
            ERR-ALREADY-NOTARIZED) ;; Conflict
        ;; Hash doesn't exist, create new notarization
        (begin
          (map-set notarizations { hash: h } { owner: tx-sender })
          (ok true))))
))

;; Get the owner of a notarized hash
;;
;; Arguments:
;; - h: The hash to look up
;;
;; Returns:
;; - (some { owner }) if hash is notarized, none otherwise
(define-read-only (get-notarization (h (buff 32)))
  (map-get? notarizations { hash: h })
)

;; Check if a hash has been notarized
;;
;; Arguments:
;; - h: The hash to check
;;
;; Returns:
;; - true if hash is notarized, false otherwise
(define-read-only (is-notarized (h (buff 32)))
  (is-some (map-get? notarizations { hash: h }))
)
