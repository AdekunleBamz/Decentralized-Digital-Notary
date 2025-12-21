;; Notary contract
;; Stores mapping: hash (buff 32) -> owner principal
;; Only store h ne (tx-sender) who called `notarize`.
;; Timestamping / exact block/time can be derived from the transaction that called `notarize` via the Stacks API.

(define-map notarizations ((hash (buff 32))) ((owner principal)))

(define-public (notarize (h (buff 32)))
  (begin
    ;; If the hash already exists, we still allow reinsertion but only if owner is same caller.
    (let ((existing (map-get? notarizations {hash: h})))
      (match existing
        some ((tuple (owner owner-principal)))
        (if (is-eq owner-principal tx-sender)
            (begin (ok true))
            (err u100)) ;; conflict: already notarized by another principal
        (begin
          (map-insert notarizations {hash: h} {owner: tx-sender})
          (ok true)))))
)

(define-read-only (get-notarization (h (buff 32)))
  (map-get? notarizations {hash: h})
)