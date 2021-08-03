package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func main() {
	mongoURL := os.Getenv("MONGO_URL")
	elasticsearchURL := os.Getenv("ELASTICSEARCH_URL")
	dbName := os.Getenv("DB_NAME")

	fmt.Println("Mongo url ", mongoURL)
	fmt.Println("Elasticsearch url ", elasticsearchURL)
	fmt.Println("Db name ", dbName)

	f, _ := os.Create("mongo-elastic.toml")

	var header = fmt.Sprintf(`
		mongo-url="%s"
		elasticsearch-urls=["%s"]
		verbose=true
	`, mongoURL, elasticsearchURL)

	f.WriteString(header)

	var namespaces []string

	namespaces = append(namespaces, fmt.Sprintf(`"%s.activity_logs"`, dbName))


	f.WriteString(`
		index-as-update=true
		prune-invalid-json = true
		direct-read-split-max = 1
		elasticsearch-max-bytes = 2000000
		elasticsearch-max-conns = 2
	`)

	f.WriteString(fmt.Sprintf("direct-read-namespaces=[%s]", strings.Join(namespaces, ",")))

	f.WriteString(fmt.Sprintf(`
		namespace-regex = "^%s.(activity_logs)$"
		routing-namespaces = [ "" ]
		delete-index-pattern = "%s*"

		[[script]]
		script = """
		module.exports = function(doc, ns) {
			var index = ns.replace(".", "__").replace("_logger", "").replace("_logs", "");

			doc._meta_monstache = {
				id: doc._id.toString(),
				index: index
			};

			doc.ownId = doc._id

			return doc;
		}
		"""
	`, dbName, dbName))

	f.Close()

	cmd := exec.Command("monstache", "-f", "mongo-elastic.toml")

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	cmd.Run()
}
