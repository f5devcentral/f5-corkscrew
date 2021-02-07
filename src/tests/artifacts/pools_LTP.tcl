ltm policy test1_ltPolicy {
    controls { forwarding }
    description "testing for pool extraction function"
    last-modified 2020-08-23:13:28:15
    requires { http }
    rules {
        css_pool_rule {
            actions {
                0 {
                    forward
                    select
                    pool css_pool
                }
            }
            conditions {
                0 {
                    http-uri
                    scheme
                    ends-with
                    values { .css }
                }
            }
        }
        jpg_pool_rule {
            actions {
                0 {
                    forward
                    select
                    pool jpg.pool
                }
            }
            conditions {
                0 {
                    http-uri
                    query-string
                    ends-with
                    values { .jpg }
                }
            }
            ordinal 1
        }
        js_pool_rule {
            actions {
                0 {
                    forward
                    select
                    pool js.io_t80_pool
                }
            }
            conditions {
                0 {
                    http-uri
                    scheme
                    ends-with
                    values { .js }
                }
            }
            ordinal 2
        }
        txt_node {
            actions {
                0 {
                    forward
                    select
                    node 10.10.10.1
                }
            }
            conditions {
                0 {
                    http-uri
                    scheme
                    ends-with
                    values { .txt }
                }
            }
            ordinal 3
        }
    }
    status published
    strategy first-match
}
